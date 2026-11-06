// Zeitraffer-Seite: zeigt die Nächte aus days.js und blättert durch. Die Liste wird hier untergeschoben.
import { expect, test } from '@playwright/test';

const DAYS = [0, 1, 2].map((day) => ({
  day, date: `2026-11-0${4 + day}`, title: `Title ${day}`, text: `Text ${day}`, shot: `shots/00${day}.png`,
}));

test('Zeitraffer zeigt die letzte Nacht und blättert', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/timelapse/days.js', (route) => route.fulfill({
    contentType: 'text/javascript', body: `export const DAYS = ${JSON.stringify(DAYS)};`,
  }));
  await page.route('**/timelapse/shots/*', (route) => route.fulfill({ status: 404 }));
  await page.goto('/timelapse/');
  await expect(page.locator('#caption-title')).toContainText('Day 2');
  await page.click('#prev');
  await expect(page.locator('#caption-title')).toContainText('Day 1');
  await expect(page.locator('#caption-play')).toHaveAttribute('href', '../day/001/');
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#caption-title')).toContainText('Day 0');
  expect(errors).toEqual([]);
});

test('Ohne Bilder erscheint ein Hinweis', async ({ page }) => {
  await page.goto('/timelapse/');
  await expect(page.locator('#empty')).toBeVisible();
});

test('Das Spiel verlinkt den Zeitraffer', async ({ page }) => {
  await page.goto('/?seed=7');
  await expect(page.locator('#open-timelapse')).toHaveAttribute('href', 'timelapse/');
});
