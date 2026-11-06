// Community-Event: Format der Daten und Ablauf im Spiel. Der UI-Test schiebt ein Test-Event unter.
import { expect, test } from '@playwright/test';
import { EVENT } from '../../content/event.js';
import { CHRONICLE } from '../../content/chronicle.js';
import { MAPS } from '../../content/world.js';
import { act, createGame } from '../../src/game.js';

const lastDay = CHRONICLE.at(-1).day;

test('Event ist null oder sauber geformt', () => {
  if (EVENT === null) return;
  expect(Object.keys(EVENT).sort()).toEqual(
    ['endDay', 'giver', 'goal', 'id', 'intro', 'need', 'reward', 'startDay', 'stat', 'task', 'text', 'title'],
  );
  // Das Event beginnt bei einer Figur, die es wirklich gibt.
  const giver = Object.values(MAPS).flatMap((map) => map.entities).find((e) => e.id === EVENT.giver);
  expect(giver?.kind).toBe('npc');
  expect(typeof EVENT.intro).toBe('string');
  expect(EVENT.intro.length).toBeGreaterThan(0);
  expect(EVENT.intro.length).toBeLessThanOrEqual(200);
  expect(EVENT.id).toMatch(/^[a-z0-9-]{1,32}$/);
  for (const key of ['title', 'text', 'task', 'reward']) {
    expect(typeof EVENT[key]).toBe('string');
    expect(EVENT[key].length).toBeGreaterThan(0);
    expect(EVENT[key].length).toBeLessThanOrEqual(key === 'title' ? 40 : 120);
  }
  expect(typeof EVENT.stat).toBe('string');
  for (const key of ['need', 'goal', 'startDay', 'endDay']) expect(Number.isInteger(EVENT[key])).toBe(true);
  expect(EVENT.need).toBeGreaterThanOrEqual(1);
  expect(EVENT.goal).toBeGreaterThanOrEqual(1);
  expect(EVENT.startDay).toBeLessThanOrEqual(EVENT.endDay);
  // Höchstens eine Woche, und ein beendetes Event muss in der Nacht danach aufgelöst werden.
  expect(EVENT.endDay - EVENT.startDay).toBeLessThanOrEqual(6);
  expect(EVENT.endDay).toBeGreaterThanOrEqual(lastDay);
});

test('Event-Statistik existiert im Spiel', async ({ page }) => {
  test.skip(EVENT === null, 'Kein Event');
  await page.goto('/?seed=7');
  await page.waitForFunction(() => window.__overnight);
  const stats = await page.evaluate(() => window.__overnight.state.stats);
  expect(typeof stats[EVENT.stat]).toBe('number');
});

test('Wer mit der Figur spricht, hört die Einleitung einmal und kennt danach das Event', () => {
  test.skip(EVENT === null || EVENT.startDay > lastDay || EVENT.endDay < lastDay, 'Kein laufendes Event');
  const [mapId, map] = Object.entries(MAPS).find(([, m]) => m.entities.some((e) => e.id === EVENT.giver));
  const giver = map.entities.find((e) => e.id === EVENT.giver);
  const s = createGame({ seed: 1 });
  s.map = mapId;
  s.creatures = [];
  // Neben die Figur stellen und hineinlaufen.
  const spots = [[-1, 0, 'right'], [1, 0, 'left'], [0, -1, 'down'], [0, 1, 'up']];
  const [dx, dy, dir] = spots.find(([x, y]) => {
    const row = map.tiles[giver.y + y] ?? '';
    return row[giver.x + x] && !map.entities.some((e) => e.x === giver.x + x && e.y === giver.y + y);
  });
  s.player.x = giver.x + dx;
  s.player.y = giver.y + dy;
  act(s, dir);
  expect(s.log.at(-1).text).toContain(EVENT.intro);
  expect(s.flags.eventsHeard?.[EVENT.id]).toBe(true);
  act(s, dir);
  expect(s.log.at(-1).text).not.toContain(EVENT.intro);
});

const FAKE = (day) => `export const EVENT = ${JSON.stringify({
  id: 'test-event', title: 'Test Event', text: 'Everyone counts.', task: 'Do it twice.',
  giver: 'scarecrow', intro: 'Please help.',
  reward: 'A cake.', stat: 'kills', need: 2, goal: 10, startDay: day, endDay: day,
})};`;

test('Spiel meldet den Tagesbeitrag einmal von selbst und zeigt den Stand', async ({ page }) => {
  const posts = [];
  await page.route('**/content/event.js', (route) => route.fulfill({ contentType: 'text/javascript', body: FAKE(lastDay) }));
  await page.route('**/event?id=test-event', (route) => route.fulfill({
    contentType: 'application/json', body: '{"count":4}', headers: { 'Access-Control-Allow-Origin': '*' },
  }));
  await page.route('**/event', (route) => {
    posts.push(JSON.parse(route.request().postData()));
    return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*' } });
  });
  await page.route('https://challenges.cloudflare.com/**', (route) => route.abort());
  await page.goto('/?seed=7');
  await page.waitForFunction(() => window.__overnight);

  await expect(page.locator('#event-box')).toBeVisible();
  // Vor dem Gespräch: nur der Hinweis, wohin, und der Stand der Gemeinschaft. Fortschritt zählt noch nicht.
  await expect(page.locator('#event-title')).toHaveText('Something is going on in The Rough Draft.');
  await expect(page.locator('#event-text')).toHaveText('Talk to The Scarecrow to learn more.');
  await expect(page.locator('#event-together')).toContainText('4 of 10 parts done, 6 more needed');
  await expect(page.locator('#event-mine')).toHaveText('');
  await page.evaluate(() => { window.__overnight.state.stats.kills += 5; window.__overnight.act('wait'); });
  expect(posts).toEqual([]);

  // Gespräch geführt: jetzt die Aufgabe.
  await page.evaluate(() => { window.__overnight.state.flags.eventsHeard = { 'test-event': true }; window.__overnight.act('wait'); });
  await expect(page.locator('#event-title')).toHaveText('Test Event');
  await expect(page.locator('#event-mine')).toHaveText('Your part today: Do it twice. (0 / 2)');
  await expect(page.locator('#event-reward')).toContainText('one part per day');

  await page.evaluate(() => { window.__overnight.state.stats.kills += 1; window.__overnight.act('wait'); });
  await expect(page.locator('#event-mine')).toHaveText('Your part today: Do it twice. (1 / 2)');
  await page.evaluate(() => { window.__overnight.state.stats.kills += 1; window.__overnight.act('wait'); });
  await expect(page.locator('#event-mine')).toContainText('done for today');
  await expect(page.locator('#event-together')).toContainText('5 of 10 parts done, 5 more needed');
  await page.evaluate(() => { window.__overnight.state.stats.kills += 5; window.__overnight.act('wait'); });
  await page.reload();
  await page.waitForFunction(() => window.__overnight);
  await expect(page.locator('#event-mine')).toContainText('done for today');
  expect(posts).toEqual([{ event: 'test-event' }]);
});

test('Ohne aktives Event bleibt die Anzeige verborgen', async ({ page }) => {
  await page.route('**/content/event.js', (route) => route.fulfill({ contentType: 'text/javascript', body: FAKE(lastDay - 1) }));
  await page.goto('/?seed=7');
  await page.waitForFunction(() => window.__overnight);
  await expect(page.locator('#event-box')).toBeHidden();
});

// Wächter für Nacht 4: Ein aktives Event darf beim Start nur den eigenen Worker fragen und keine Fehler werfen.
test('Mit aktivem Event startet das Spiel ohne Fehler und fragt nur den eigenen Worker', async ({ page }) => {
  const worker = 'https://overnight-suggestions.overnight-rpg.workers.dev';
  const problems = [];
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  page.on('console', (message) => { if (message.type() === 'error') problems.push(`console: ${message.text()}`); });
  page.on('request', (request) => {
    const { origin } = new URL(request.url());
    if (!['http://127.0.0.1:4173', 'null', worker].includes(origin) && !request.url().startsWith('data:')) problems.push(`extern: ${request.url()}`);
  });
  await page.addInitScript(() => { window.WebSocket = class { addEventListener() {} send() {} close() {} }; });
  await page.route('**/content/event.js', (route) => route.fulfill({ contentType: 'text/javascript', body: FAKE(lastDay) }));
  let asked = 0;
  await page.route(`${worker}/**`, (route) => {
    if (route.request().url().includes('/event?id=')) asked += 1;
    return route.fulfill({ contentType: 'application/json', body: '{"count":2}', headers: { 'Access-Control-Allow-Origin': '*' } });
  });
  await page.goto('/?seed=7');
  await page.waitForFunction(() => window.__overnight);
  await expect(page.locator('#event-box')).toBeVisible();
  await expect(page.locator('#event-together')).toContainText('2 of 10 parts done');
  expect(asked).toBe(1);
  expect(problems).toEqual([]);
});
