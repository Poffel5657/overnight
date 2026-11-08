// Chat im Spiel: Lesen ohne Ticket, Beitreten mit Captcha, Schreiben, Melden. WebSocket ist nachgebaut.
import { expect, test } from '@playwright/test';
import { CONTACT_EMAIL } from '../../src/config.js';

const fakeSocket = () => {
  window.__sockets = [];
  window.WebSocket = class {
    constructor(url) {
      this.url = String(url);
      this.sent = [];
      this.listeners = {};
      // Echos (/presence) haben eigene Tests; hier zählen nur Chat-Sockets.
      if (this.url.includes('/presence')) return;
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
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/?seed=7');
  await page.waitForFunction(() => window.__overnight);

  // Am PC steht der Chat ohne Klick rechts neben dem Spiel.
  await expect(page.locator('#chat-pane')).toBeVisible();
  await expect(page.locator('#open-chat')).toBeHidden();
  const map = await page.locator('#world').boundingBox();
  const chat = await page.locator('#chat-pane').boundingBox();
  expect(chat.x).toBeGreaterThan(map.x + map.width - 1);
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

  // Tasten im Chat bewegen den Spieler nicht, auch nicht w, a, s, d und Leertaste
  const turn = await page.evaluate(() => window.__overnight.state.turn);
  await page.click('#chat-input');
  await page.keyboard.type('good evening, meadow');
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
  await page.reload();
  await page.waitForFunction(() => window.__overnight);
  await expect(page.locator('#chat-compose')).toBeVisible();
});

test.describe('Chat am Handy', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  test('Chat öffnet sich als Vollbild und verbindet erst dann', async ({ page }) => {
    await page.addInitScript(fakeSocket);
    await page.goto('/?seed=7');
    await page.waitForFunction(() => window.__overnight);
    await expect(page.locator('#chat-pane')).toBeHidden();
    expect(await page.evaluate(() => window.__sockets.length)).toBe(0);
    await page.click('#open-chat');
    await expect(page.locator('#chat-pane')).toBeVisible();
    await expect(page.locator('#chat-list li')).toHaveCount(2);
    const box = await page.locator('#chat-pane').boundingBox();
    expect(box.width).toBeGreaterThan(380);
    await page.click('#chat-close');
    await expect(page.locator('#chat-pane')).toBeHidden();
    expect(await page.evaluate(() => window.__sockets.at(-1).closed)).toBe(true);
  });
});

test('Kontakt: GitHub-Links und, falls eingetragen, die E-Mail-Adresse', async ({ page }) => {
  await page.goto('/?seed=7');
  await page.waitForFunction(() => window.__overnight);
  await page.click('[aria-controls="panel-contact"]');
  await expect(page.locator('#panel-contact a[href*="github.com/Poffel5657/overnight/issues"]')).toBeVisible();
  if (CONTACT_EMAIL) {
    await expect(page.locator('#contact-email')).toHaveAttribute('href', `mailto:${CONTACT_EMAIL}`);
    await expect(page.locator('#contact-email-note')).toHaveText(CONTACT_EMAIL);
  } else {
    await expect(page.locator('#contact-email-row')).toBeHidden();
  }
});
