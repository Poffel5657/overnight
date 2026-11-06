// Chat im Spiel: Lesen ohne Ticket, Beitreten mit Captcha, Schreiben, Melden. WebSocket ist nachgebaut.
import { expect, test } from '@playwright/test';

const fakeSocket = () => {
  window.__sockets = [];
  window.WebSocket = class {
    constructor(url) {
      this.url = String(url);
      this.sent = [];
      this.listeners = {};
      window.__sockets.push(this);
      const withTicket = this.url.includes('ticket=');
      const history = [
        { id: 1, ts: Date.now(), name: 'weaver-111', text: 'hello there' },
        { id: 2, ts: Date.now(), name: 'scribe-222', text: '<img src=x onerror="window.__xss=1">' },
      ];
      setTimeout(() => this.emit('message', { data: JSON.stringify({ type: 'hello', name: withTicket ? 'tinker-abc' : null, history }) }), 0);
    }
    addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
    emit(type, event) { (this.listeners[type] || []).forEach((fn) => fn(event)); }
    send(raw) {
      const data = JSON.parse(raw);
      this.sent.push(data);
      if (data.type === 'say') {
        this.emit('message', { data: JSON.stringify({ type: 'msg', message: { id: 3, ts: Date.now(), name: 'tinker-abc', text: data.text } }) });
      }
    }
    close() { this.closed = true; }
  };
};

test('Chat: lesen, beitreten, schreiben, melden', async ({ page }) => {
  await page.addInitScript(fakeSocket);
  await page.route('https://challenges.cloudflare.com/**', (route) => route.fulfill({
    contentType: 'text/javascript',
    body: 'window.turnstile = { render: (el, o) => { o.callback("test-token"); return "w1"; }, reset() {} };',
  }));
  let ticketBody = null;
  await page.route('**/chat/ticket', (route) => {
    ticketBody = JSON.parse(route.request().postData());
    return route.fulfill({ contentType: 'application/json', body: '{"ticket":"T.abc.sig","name":"tinker-abc"}', headers: { 'Access-Control-Allow-Origin': '*' } });
  });
  await page.goto('/?seed=7');
  await page.waitForFunction(() => window.__overnight);

  await page.click('#open-chat');
  await expect(page.locator('#chat-list li')).toHaveCount(2);
  await expect(page.locator('#chat-list li').first()).toContainText('weaver-111');
  // Fremder Text bleibt Text
  await expect(page.locator('#chat-list img')).toHaveCount(0);
  expect(await page.evaluate(() => window.__xss)).toBeUndefined();
  await expect(page.locator('#chat-join')).toBeVisible();
  await expect(page.locator('#chat-compose')).toBeHidden();
  expect(await page.evaluate(() => window.__sockets[0].url)).toMatch(/^wss:\/\/.+\/chat$/);

  await page.click('#chat-join-button');
  await expect(page.locator('#chat-compose')).toBeVisible();
  await expect(page.locator('#chat-name')).toHaveText('You are tinker-abc today.');
  expect(ticketBody).toEqual({ token: 'test-token' });
  expect(await page.evaluate(() => window.__sockets.at(-1).url)).toContain('ticket=T.abc.sig');

  // Tasten im Chat bewegen den Spieler nicht
  const turn = await page.evaluate(() => window.__overnight.state.turn);
  await page.fill('#chat-input', 'good evening, meadow');
  await page.keyboard.press('Enter');
  await expect(page.locator('#chat-list li').last()).toContainText('good evening, meadow');
  expect(await page.evaluate(() => window.__overnight.state.turn)).toBe(turn);
  expect(await page.evaluate(() => window.__sockets.at(-1).sent)).toEqual([{ type: 'say', text: 'good evening, meadow' }]);
  // Eigene Nachricht hat keinen Melden-Knopf
  await expect(page.locator('#chat-list li').last().locator('.chat-report')).toHaveCount(0);

  await page.locator('#chat-list li').first().locator('.chat-report').click();
  expect(await page.evaluate(() => window.__sockets.at(-1).sent.at(-1))).toEqual({ type: 'report', id: 1 });

  await page.evaluate(() => window.__sockets.at(-1).emit('message', { data: JSON.stringify({ type: 'hide', id: 1 }) }));
  await expect(page.locator('#chat-list li')).toHaveCount(2);
  await expect(page.locator('#chat-list')).not.toContainText('hello there');

  // Nach dem Neuladen ist man heute noch drin
  await page.keyboard.press('Escape');
  await page.reload();
  await page.waitForFunction(() => window.__overnight);
  await page.click('#open-chat');
  await expect(page.locator('#chat-compose')).toBeVisible();
});

test('Kontakt: GitHub-Links, ohne Adresse keine E-Mail', async ({ page }) => {
  await page.goto('/?seed=7');
  await page.waitForFunction(() => window.__overnight);
  await page.click('[aria-controls="panel-contact"]');
  await expect(page.locator('#panel-contact a[href*="github.com/Poffel5657/overnight/issues"]')).toBeVisible();
  await expect(page.locator('#contact-email-row')).toBeHidden();
});
