// Community-Event: Format der Daten und Ablauf im Spiel. Der UI-Test schiebt ein Test-Event unter.
import { expect, test } from '@playwright/test';
import { EVENT } from '../../content/event.js';
import { CHRONICLE } from '../../content/chronicle.js';

const lastDay = CHRONICLE.at(-1).day;

test('Event ist null oder sauber geformt', () => {
  if (EVENT === null) return;
  expect(Object.keys(EVENT).sort()).toEqual(
    ['endDay', 'goal', 'id', 'need', 'reward', 'startDay', 'stat', 'task', 'text', 'title'],
  );
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

const FAKE = (day) => `export const EVENT = ${JSON.stringify({
  id: 'test-event', title: 'Test Event', text: 'Everyone counts.', task: 'Do it twice.',
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
  await expect(page.locator('#event-title')).toHaveText('Test Event');
  await expect(page.locator('#event-together')).toContainText('4 / 10');
  await expect(page.locator('#event-mine')).toHaveText('Your part today: 0 / 2');

  await page.evaluate(() => { window.__overnight.state.stats.kills += 1; window.__overnight.act('wait'); });
  await expect(page.locator('#event-mine')).toHaveText('Your part today: 1 / 2');
  await page.evaluate(() => { window.__overnight.state.stats.kills += 1; window.__overnight.act('wait'); });
  await expect(page.locator('#event-mine')).toContainText('done for today');
  await expect(page.locator('#event-together')).toContainText('5 / 10');
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
