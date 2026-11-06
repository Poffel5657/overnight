// Stimmzettel und Abstimmungsdialog. Der Zettel muss jede Nacht neu datiert und sauber geformt sein.
import { expect, test } from '@playwright/test';
import { BALLOT } from '../../content/ballot.js';
import { CHRONICLE } from '../../content/chronicle.js';

const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date());
const lastDay = CHRONICLE.at(-1).day;

test('Stimmzettel ist von heute Nacht und sauber geformt', () => {
  expect(BALLOT.day).toBe(lastDay);
  expect(Array.isArray(BALLOT.options)).toBe(true);
  expect(BALLOT.options.length).toBeLessThanOrEqual(5);
  const ids = BALLOT.options.map((option) => option.id);
  expect(new Set(ids).size).toBe(ids.length);
  for (const option of BALLOT.options) {
    expect(Object.keys(option).sort()).toEqual(['id', 'since', 'text']);
    expect(option.id).toMatch(/^[a-z0-9-]{1,32}$/);
    expect(Number.isInteger(option.since)).toBe(true);
    expect(option.since).toBeLessThanOrEqual(lastDay);
    // Höchstens drei Nächte auf dem Zettel, dann fliegt die Idee.
    expect(lastDay - option.since).toBeLessThan(3);
    expect(typeof option.text).toBe('string');
    expect(option.text.length).toBeGreaterThan(0);
    expect(option.text.length).toBeLessThanOrEqual(90);
  }
});

const open = async (page) => {
  await page.route('https://challenges.cloudflare.com/**', (route) => route.abort());
  await page.goto('/?seed=7');
  await page.waitForFunction(() => window.__overnight);
};

test('Der Dialog zeigt alle Ideen und schickt die Wahl mit Zettelnummer', async ({ page }) => {
  test.skip(BALLOT.options.length === 0, 'Leerer Zettel');
  let sent = null;
  await page.route('**/vote', async (route) => {
    sent = { url: route.request().url(), body: JSON.parse(route.request().postData()) };
    await route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*' } });
  });
  // Ein Fake-Turnstile, das sofort ein Token liefert.
  await page.route('https://challenges.cloudflare.com/**', (route) => route.fulfill({
    contentType: 'text/javascript',
    body: 'window.turnstile = { render: (el, o) => { o.callback("test-token"); return "w1"; }, reset() {} };',
  }));
  await page.goto('/?seed=7');
  await page.waitForFunction(() => window.__overnight);
  await page.click('#open-vote');
  await expect(page.locator('.vote-option')).toHaveCount(BALLOT.options.length);
  await page.locator('.vote-option').first().click();
  await page.click('#vote-send');
  await expect(page.locator('#vote-status')).toContainText('Thanks');
  expect(sent.url).toMatch(/\/vote$/);
  expect(sent.body).toMatchObject({ ballot: BALLOT.day, choice: BALLOT.options[0].id, website: '', token: 'test-token' });
});

test('Nach einer Stimme heute bleibt der Dialog zu', async ({ page }) => {
  test.skip(BALLOT.options.length === 0, 'Leerer Zettel');
  await page.addInitScript((day) => localStorage.setItem('overnight.voted', day), today());
  await open(page);
  await page.click('#open-vote');
  await expect(page.locator('#vote-send')).toBeHidden();
  await expect(page.locator('#vote-status')).toContainText('already voted');
});

test('Ohne Auswahl wird nichts geschickt', async ({ page }) => {
  test.skip(BALLOT.options.length === 0, 'Leerer Zettel');
  await open(page);
  await page.click('#open-vote');
  await page.click('#vote-send');
  await expect(page.locator('#vote-status')).toHaveText('Pick one idea first.');
});
