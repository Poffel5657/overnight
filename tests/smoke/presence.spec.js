// Echos im Spiel: andere Spieler erscheinen, bewegen sich, winken. WebSocket ist nachgebaut.
import { expect, test } from '@playwright/test';
import { PRESENCE } from '../../content/presence.js';

const fakeSocket = () => {
  window.__presence = [];
  window.WebSocket = class {
    constructor(url) {
      this.url = String(url);
      this.sent = [];
      this.listeners = {};
      if (!this.url.includes('/presence')) return;
      window.__presence.push(this);
      const peers = [
        { id: 'aa11', name: 'tinker-3f2', map: '__MAP__', x: 1, y: 1 },
        { id: 'bb22', name: '<b>x</b>', map: '__MAP__', x: 2, y: 2 },
        { id: 'cc33', name: 'weaver-111', map: 'nowhere-at-all', x: 2, y: 2 },
      ];
      setTimeout(() => {
        const map = window.__overnight.state.map;
        for (const p of peers) if (p.map === '__MAP__') p.map = map;
        this.emit('message', { data: JSON.stringify({ t: 'hello', id: 'ff00', name: 'scribe-abc', peers }) });
      }, 0);
    }
    addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
    emit(type, event) { (this.listeners[type] || []).forEach((fn) => fn(event)); }
    send(raw) { this.sent.push(JSON.parse(raw)); }
    close() { this.closed = true; }
  };
};

test('Echos: nur mit ?echoes=1 vor dem Starttag, dann Anzeige, Position und Gesten', async ({ page }) => {
  await page.addInitScript(fakeSocket);
  await page.setViewportSize({ width: 1280, height: 800 });

  await page.goto('/?seed=7');
  await page.waitForFunction(() => window.__overnight);
  if (await page.evaluate(() => window.__overnight.day) < PRESENCE.fromDay) {
    expect(await page.evaluate(() => window.__presence.length)).toBe(0);
    await expect(page.locator('#emotes')).toBeHidden();
  }

  await page.goto('/?seed=7&echoes=1');
  await page.waitForFunction(() => window.__overnight && window.__presence.length === 1);
  expect(await page.evaluate(() => window.__presence[0].url)).toMatch(/^wss:\/\/.+\/presence$/);
  // Nach dem Hallo meldet das Spiel die eigene Position.
  await page.waitForFunction(() => window.__presence[0].sent.length > 0);
  const first = await page.evaluate(() => window.__presence[0].sent[0]);
  const s = await page.evaluate(() => ({ map: window.__overnight.state.map, x: window.__overnight.state.player.x, y: window.__overnight.state.player.y }));
  expect(first).toEqual({ t: 'pos', ...s });
  // Ungültiger Name und unbekannte Karte werden verworfen: nur eins von drei Echos.
  await expect(page.locator('#echo-count')).toHaveText('· 1 here · 1 out there');
  expect(await page.evaluate(() => window.__overnight.echoes.here().map((p) => p.name))).toEqual(['tinker-3f2']);

  // Andere bewegen sich und winken; das Log zeigt es als Text.
  await page.evaluate(() => {
    const ws = window.__presence[0];
    ws.emit('message', { data: JSON.stringify({ t: 'pos', id: 'aa11', name: 'tinker-3f2', map: window.__overnight.state.map, x: 3, y: 1 }) });
    ws.emit('message', { data: JSON.stringify({ t: 'emote', id: 'aa11', e: 'wave' }) });
  });
  await expect(page.locator('#log li').last()).toContainText('tinker-3f2 waves.');
  expect(await page.evaluate(() => window.__overnight.echoes.bubbleOf('aa11'))).toBe('o/');

  // Selbst winken: Knopf und Taste.
  await page.click('#emotes button[data-emote="wave"]');
  await page.keyboard.press(PRESENCE.emotes.find((e) => e.id === 'cheer').key);
  const emotes = await page.evaluate(() => window.__presence[0].sent.filter((m) => m.t === 'emote'));
  expect(emotes).toEqual([{ t: 'emote', e: 'wave' }, { t: 'emote', e: 'cheer' }]);

  // Ein Schritt meldet die neue Position (gedrosselt, aber sie kommt an).
  const before = await page.evaluate(() => window.__presence[0].sent.length);
  for (const action of ['right', 'left', 'down', 'up']) await page.evaluate((a) => window.__overnight.act(a), action);
  await page.waitForFunction((n) => window.__presence[0].sent.length > n, before);
  const last = await page.evaluate(() => window.__presence[0].sent.filter((m) => m.t === 'pos').at(-1));
  const now = await page.evaluate(() => ({ map: window.__overnight.state.map, x: window.__overnight.state.player.x, y: window.__overnight.state.player.y }));
  await page.waitForFunction((n) => {
    const pos = window.__presence[0].sent.filter((m) => m.t === 'pos').at(-1);
    return pos.x === n.x && pos.y === n.y;
  }, now);
  expect(last.t).toBe('pos');

  // Weg ist weg.
  await page.evaluate(() => window.__presence[0].emit('message', { data: JSON.stringify({ t: 'gone', id: 'aa11' }) }));
  await expect(page.locator('#echo-count')).toHaveText('· alone');
});

