// Zeitraffer-Seite: zeigt die Weltkarten aus days.js und blättert durch. Die Liste wird hier untergeschoben.
import { expect, test } from '@playwright/test';

const tiles = { ' ': { glyph: ' ', fg: '#000', bg: '#07070f' }, '.': { glyph: '.', fg: '#3f6b48', bg: '#14241b' } };
const area = (name, doors = []) => ({ name, tiles: ['....', '....', '....'], figures: [{ x: 1, y: 1, glyph: 'K', color: '#fff' }], doors });
// Ab Tag 2 gibt es ein zweites Gebiet hinter einer Tür im Osten: Die Karte wird breiter.
const world = (day) => ({
  start: { map: 'meadow', x: 0, y: 0 },
  tiles,
  maps: day < 2
    ? { meadow: area('The Meadow') }
    : { meadow: area('The Meadow', [{ x: 3, y: 1, to: { map: 'draft', x: 0, y: 1 } }]), draft: area('The Rough Draft') },
});
const DAYS = [0, 1, 2].map((day) => ({
  day, date: `2026-11-0${4 + day}`, title: `Title ${day}`, text: `Text ${day}`, world: world(day),
}));

test('Zeitraffer zeigt die letzte Nacht und blättert', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/timelapse/days.js', (route) => route.fulfill({
    contentType: 'text/javascript', body: `export const DAYS = ${JSON.stringify(DAYS)};`,
  }));
  await page.goto('/timelapse/');
  await expect(page.locator('#caption-title')).toContainText('Day 2');
  const atlas = page.locator('#atlas');
  await expect(atlas).toHaveAttribute('aria-label', 'The world on day 2: The Meadow, The Rough Draft');
  // Die Karte wird auf den Rahmen skaliert; gezeichnet wird ab Tag 2 aber mehr Welt.
  const wide = await atlas.evaluate((canvas) => canvas.width);
  await page.click('#prev');
  await expect(atlas).toHaveAttribute('aria-label', 'The world on day 1: The Meadow');
  expect(await atlas.evaluate((canvas) => canvas.width)).toBeLessThan(wide);
  await expect(page.locator('#caption-title')).toContainText('Day 1');
  await expect(page.locator('#caption-play')).toHaveAttribute('href', '../day/001/');
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#caption-title')).toContainText('Day 0');
  expect(errors).toEqual([]);
});

test('Ohne Nächte erscheint ein Hinweis', async ({ page }) => {
  await page.goto('/timelapse/');
  await expect(page.locator('#empty')).toBeVisible();
});

test('Das Spiel verlinkt den Zeitraffer', async ({ page }) => {
  await page.goto('/?seed=7');
  await expect(page.locator('#open-timelapse')).toHaveAttribute('href', 'timelapse/');
});
