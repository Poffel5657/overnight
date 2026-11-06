// Allgemeine Tests, die an jedem Tag gelten. Sie dürfen nichts über konkrete Inhalte annehmen.
import { expect, test } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';

// Der Chat verbindet sich am PC beim Start. Im Test wird die Verbindung nur aufgezeichnet, nicht aufgebaut;
// erlaubt ist ausschließlich der eigene Worker.
const CHAT_SOCKET = /^wss:\/\/overnight-suggestions\.overnight-rpg\.workers\.dev\/chat(\?|$)/;
// Der eigene Worker darf beim Start gefragt werden (zum Beispiel der Zählerstand eines Events).
// Im Test antwortet eine Attrappe, damit nichts an den echten Worker geht. Alle anderen Hosts bleiben verboten.
const WORKER_ORIGIN = 'https://overnight-suggestions.overnight-rpg.workers.dev';

const openGame = async (page, url = '/?seed=7') => {
  const problems = [];
  await page.addInitScript(() => {
    window.__socketUrls = [];
    window.WebSocket = class {
      constructor(target) { window.__socketUrls.push(String(target)); }
      addEventListener() {}
      send() {}
      close() {}
    };
  });
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`console: ${message.text()}`);
  });
  await page.route(`${WORKER_ORIGIN}/**`, (route) => route.fulfill(route.request().method() === 'GET'
    ? { contentType: 'application/json', body: '{"count":0,"counts":{}}', headers: { 'Access-Control-Allow-Origin': '*' } }
    : { status: 204, headers: { 'Access-Control-Allow-Origin': '*' } }));
  page.on('request', (request) => {
    const { origin } = new URL(request.url());
    if (!['http://127.0.0.1:4173', 'null', WORKER_ORIGIN].includes(origin) && !request.url().startsWith('data:')) {
      problems.push(`extern: ${request.url()}`);
    }
  });
  await page.goto(url);
  await page.waitForFunction(() => window.__overnight);
  for (const target of await page.evaluate(() => window.__socketUrls)) {
    if (!CHAT_SOCKET.test(target)) problems.push(`websocket: ${target}`);
  }
  return problems;
};

const checkInvariants = () => import('/src/game.js').then(({ tileAt }) => {
  const { state: s } = window.__overnight;
  const { x, y, hp, maxHp } = s.player;
  const broken = [];
  if (!tileAt(s.map, x, y).walkable) broken.push(`Spieler auf ${x},${y} nicht begehbar`);
  if (!(hp > 0 && hp <= maxHp)) broken.push(`HP ${hp}/${maxHp}`);
  for (const c of s.creatures) {
    if (c.respawnAt === null && !tileAt(s.map, c.x, c.y).walkable) {
      broken.push(`${c.type} auf ${c.x},${c.y} nicht begehbar`);
    }
  }
  return broken;
});

test('Spiel startet ohne Fehler und ohne externe Anfragen', async ({ page }) => {
  const problems = await openGame(page);
  await expect(page.locator('#world')).toBeVisible();
  await expect(page.locator('#day-label')).toHaveText(/^Day \d+$/);
  expect(problems).toEqual([]);
});

test('Tasten bewegen das Spiel weiter', async ({ page }) => {
  await openGame(page);
  for (const key of ['ArrowDown', 'ArrowDown', 'ArrowDown', ' ']) await page.keyboard.press(key);
  expect(await page.evaluate(() => window.__overnight.state.turn)).toBeGreaterThan(0);
});

test('Zufälliges Spielen über viele Züge bricht nichts', async ({ page }) => {
  const problems = await openGame(page);
  await page.evaluate(() => {
    const actions = ['up', 'down', 'left', 'right', 'wait'];
    let x = 12345;
    for (let i = 0; i < 1500; i += 1) {
      x = (x * 1103515245 + 12345) & 0x7fffffff;
      window.__overnight.act(actions[(x >> 8) % actions.length]);
    }
  });
  expect(problems).toEqual([]);
  expect(await page.evaluate(checkInvariants)).toEqual([]);
});

test('Inhalte sind in sich stimmig', async ({ page }) => {
  await openGame(page);
  const issues = await page.evaluate(async () => {
    const { MAPS, START } = await import('/content/world.js');
    const { CREATURES } = await import('/content/creatures.js');
    const { CHRONICLE } = await import('/content/chronicle.js');
    const { tileAt, INTERACTIONS, AI_BEHAVIOURS } = await import('/src/game.js');
    const found = [];
    CHRONICLE.forEach((entry, index) => {
      if (entry.day !== index) found.push(`Chronik: Tag ${entry.day} an Position ${index}`);
      if (!entry.title || !entry.text) found.push(`Chronik: Tag ${entry.day} unvollständig`);
    });
    if (!tileAt(START.map, START.x, START.y).walkable) found.push('Start nicht begehbar');
    for (const [id, map] of Object.entries(MAPS)) {
      const used = new Set();
      for (const e of map.entities) {
        if (!INTERACTIONS[e.kind]) found.push(`${id}: Objektart ${e.kind} unbekannt`);
        if (!tileAt(id, e.x, e.y).walkable) found.push(`${id}: ${e.id} steht auf Hindernis`);
        const spot = `${e.x},${e.y}`;
        if (used.has(spot)) found.push(`${id}: Objekte überlappen auf ${spot}`);
        used.add(spot);
      }
      for (const sp of map.spawns) {
        if (!CREATURES[sp.type]) found.push(`${id}: Kreatur ${sp.type} unbekannt`);
        else if (!AI_BEHAVIOURS[CREATURES[sp.type].ai]) found.push(`${sp.type}: Verhalten unbekannt`);
        if (!tileAt(id, sp.x, sp.y).walkable) found.push(`${id}: Spawn ${sp.x},${sp.y} auf Hindernis`);
      }
    }
    return found;
  });
  expect(issues).toEqual([]);
});

test('Spielstand überlebt das Neuladen', async ({ page }) => {
  await openGame(page);
  await page.evaluate(() => {
    window.__overnight.act('wait');
    window.__overnight.act('wait');
  });
  const before = await page.evaluate(() => window.__overnight.state.turn);
  await page.reload();
  await page.waitForFunction(() => window.__overnight);
  expect(await page.evaluate(() => window.__overnight.state.turn)).toBe(before);
});

for (const file of readdirSync('tests/fixtures').filter((name) => name.endsWith('.json'))) {
  test(`Alter Spielstand ${file} lässt sich laden und weiterspielen`, async ({ page }) => {
    const save = readFileSync(`tests/fixtures/${file}`, 'utf8');
    await page.addInitScript((data) => {
      if (!sessionStorage.getItem('seeded')) {
        localStorage.setItem('overnight.save', data);
        sessionStorage.setItem('seeded', '1');
      }
    }, save);
    const problems = await openGame(page);
    const { turn } = JSON.parse(save);
    expect(await page.evaluate(() => window.__overnight.state.turn)).toBe(turn);
    await page.evaluate(() => { for (let i = 0; i < 50; i += 1) window.__overnight.act('wait'); });
    expect(await page.evaluate(checkInvariants)).toEqual([]);
    expect(problems).toEqual([]);
  });
}

test('Kaputter Spielstand führt zu einem neuen Spiel', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('overnight.save', '{nicht json'));
  const problems = await openGame(page);
  expect(await page.evaluate(() => window.__overnight.state.turn)).toBe(0);
  expect(problems).toEqual([]);
});

test('Spieler in inzwischen festem Gelände wird umgesetzt', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('overnight.save', JSON.stringify({
    version: 1, map: 'meadow', player: { x: 0, y: 0, hp: 5, maxHp: 10, atk: 1 }, turn: 3, flags: {}, stats: {}, lastSeenDay: 0,
  })));
  await openGame(page);
  expect(await page.evaluate(checkInvariants)).toEqual([]);
});

test('Archivversionen haben eigene Spielstände', async ({ page }) => {
  await openGame(page);
  const keys = await page.evaluate(async () => {
    const { saveKey } = await import('/src/save.js');
    return [saveKey('/overnight/'), saveKey('/overnight/day/012/')];
  });
  expect(keys[0]).toBe('overnight.save');
  expect(keys[1]).toBe('overnight.save.day012');
});
