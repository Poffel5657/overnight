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
      if (this.url.includes('/chat')) {
        window.__chat = this;
        setTimeout(() => this.emit('message', { data: JSON.stringify({ type: 'hello', name: 'scribe-abc', history: [] }) }), 0);
        return;
      }
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


test('Gemeinsame Welt im Spiel: Kreaturen vom Server, Treffer, gemeinsamer Sieg, Biss, Rückfall auf solo', async ({ page }) => {
  await page.addInitScript(fakeSocket);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/?seed=7&echoes=1');
  await page.waitForFunction(() => window.__overnight && window.__presence.length === 1 && window.__presence[0].sent.length > 0);

  // Der Server schickt eine Ratte direkt rechts neben den Spieler.
  await page.evaluate(() => {
    const s = window.__overnight.state;
    window.__presence[0].emit('message', { data: JSON.stringify({ t: 'world', map: s.map, turn: 1, creatures: [
      { id: 'c7', type: 'rat', x: s.player.x + 1, y: s.player.y, hp: 2 },
      { id: 'c8', type: 'no-such-creature', x: 1, y: 1, hp: 2 },
    ] }) });
  });
  const s1 = await page.evaluate(() => ({ shared: window.__overnight.state.shared, creatures: window.__overnight.state.creatures.map((c) => c.id) }));
  expect(s1).toEqual({ shared: true, creatures: ['c7'] });

  // Zug nach rechts ist ein Treffer, der an den Server geht. Die Ratte bewegt sich nicht von selbst.
  const xpBefore = await page.evaluate(() => window.__overnight.state.player.xp);
  await page.evaluate(() => window.__overnight.act('right'));
  const hit = await page.evaluate(() => window.__presence[0].sent.filter((m) => m.t === 'hit'));
  expect(hit).toHaveLength(1);
  expect(hit[0]).toMatchObject({ t: 'hit', id: 'c7' });
  expect(hit[0].dmg).toBeGreaterThan(0);

  // Sieg zusammen mit tinker-3f2: Erfahrung für mich, Log nennt den anderen.
  await page.evaluate(() => window.__presence[0].emit('message', { data: JSON.stringify({
    t: 'slain', id: 'c7', type: 'rat', by: [{ id: 'ff00', name: 'scribe-abc' }, { id: 'aa11', name: 'tinker-3f2' }],
  }) }));
  await expect.poll(() => page.evaluate(() => window.__overnight.state.player.xp)).toBeGreaterThan(xpBefore);
  await expect(page.locator('#log')).toContainText('Together with tinker-3f2 you defeat the rat.');

  // Sieg nur durch andere: keine Erfahrung, nur eine Zeile.
  const xpMid = await page.evaluate(() => window.__overnight.state.player.xp);
  await page.evaluate(() => window.__presence[0].emit('message', { data: JSON.stringify({
    t: 'slain', id: 'c9', type: 'rat', by: [{ id: 'aa11', name: 'tinker-3f2' }],
  }) }));
  await expect(page.locator('#log')).toContainText('tinker-3f2 defeated the rat.');
  expect(await page.evaluate(() => window.__overnight.state.player.xp)).toBe(xpMid);

  // Biss vom Server kostet HP.
  const hp = await page.evaluate(() => window.__overnight.state.player.hp);
  await page.evaluate(() => window.__presence[0].emit('message', { data: JSON.stringify({ t: 'bite', type: 'rat' }) }));
  expect(await page.evaluate(() => window.__overnight.state.player.hp)).toBe(hp - 1);

  // Verbindung weg: eigene Welt mit eigenen Kreaturen, Züge bewegen sie wieder selbst.
  await page.evaluate(() => window.__presence[0].emit('close', {}));
  const s2 = await page.evaluate(() => ({ shared: window.__overnight.state.shared, n: window.__overnight.state.creatures.length }));
  expect(s2.shared).toBe(false);
  expect(s2.n).toBeGreaterThan(0);
});

test('Gemeinsame Welt: Server kennt die Karte nicht, dann bleibt sie solo', async ({ page }) => {
  await page.addInitScript(fakeSocket);
  await page.goto('/?seed=7&echoes=1');
  await page.waitForFunction(() => window.__overnight && window.__presence.length === 1 && window.__presence[0].sent.length > 0);
  await page.evaluate(() => {
    const s = window.__overnight.state;
    window.__presence[0].emit('message', { data: JSON.stringify({ t: 'world', map: s.map, creatures: [] }) });
  });
  expect(await page.evaluate(() => window.__overnight.state.shared)).toBe(true);
  await page.evaluate(() => {
    const s = window.__overnight.state;
    window.__presence[0].emit('message', { data: JSON.stringify({ t: 'world', map: s.map, creatures: null }) });
  });
  expect(await page.evaluate(() => window.__overnight.state.shared)).toBe(false);
  expect(await page.evaluate(() => window.__overnight.state.creatures.length)).toBeGreaterThan(0);
});

test('Chatnachrichten erscheinen als Sprechblase über dem, der sie schreibt', async ({ page }) => {
  await page.addInitScript(fakeSocket);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/?seed=7&echoes=1');
  await page.waitForFunction(() => window.__overnight && window.__chat && window.__overnight.echoes.here().length === 1);
  const say = (id, name, text) => page.evaluate(([i, n, t]) => window.__chat.emit('message', {
    data: JSON.stringify({ type: 'msg', message: { id: i, ts: Date.now(), name: n, text: t } }),
  }), [id, name, text]);
  await say(11, 'tinker-3f2', 'over here, by the well!');
  expect(await page.evaluate(() => window.__overnight.chatBubble('tinker-3f2'))).toBe('over here, by the well!');
  // Eigene Nachricht: Blase über dem eigenen Spieler.
  await say(12, 'scribe-abc', 'coming <b>now</b>');
  expect(await page.evaluate(() => window.__overnight.chatBubble(null))).toBe('coming <b>now</b>');
  // Versteckte Nachricht verschwindet auch von der Karte.
  await page.evaluate(() => window.__chat.emit('message', { data: JSON.stringify({ type: 'hide', id: 11 }) }));
  expect(await page.evaluate(() => window.__overnight.chatBubble('tinker-3f2'))).toBeNull();
  // Langer Text bricht ohne Fehler um.
  await say(13, 'tinker-3f2', 'x'.repeat(200));
  await page.evaluate(() => window.__overnight.act('wait'));
  expect(await page.evaluate(() => window.__overnight.chatBubble('tinker-3f2'))).toHaveLength(200);
});
