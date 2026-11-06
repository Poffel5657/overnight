// Bewertung der Nacht: ein Klick, einmal pro Nacht, Tagesnummer wird mitgeschickt.
import { expect, test } from '@playwright/test';
import { CHRONICLE } from '../../content/chronicle.js';

const lastDay = CHRONICLE.at(-1).day;

const open = async (page) => {
  await page.route('https://challenges.cloudflare.com/**', (route) => route.abort());
  await page.goto('/?seed=7');
  await page.waitForFunction(() => window.__overnight);
};

test('Bewertung schickt Tag und Wert und verschwindet danach', async ({ page }) => {
  test.skip(lastDay < 1, 'Tag 0 wird nicht bewertet');
  const posts = [];
  await page.route('**/rate', (route) => {
    posts.push(JSON.parse(route.request().postData()));
    return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*' } });
  });
  await open(page);
  await expect(page.locator('#rate-question')).toHaveText(`How was night ${lastDay}?`);
  await page.click('[data-rate="up"]');
  await expect(page.locator('#rate-status')).toContainText('Thanks');
  expect(posts).toEqual([{ day: lastDay, value: 'up' }]);
  await page.reload();
  await page.waitForFunction(() => window.__overnight);
  await expect(page.locator('#rate-box')).toBeHidden();
});

test('Fehlschlag lässt die Knöpfe benutzbar', async ({ page }) => {
  test.skip(lastDay < 1, 'Tag 0 wird nicht bewertet');
  await page.route('**/rate', (route) => route.fulfill({ status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }));
  await open(page);
  await page.click('[data-rate="down"]');
  await expect(page.locator('#rate-status')).toContainText("didn't work");
  await expect(page.locator('[data-rate="down"]')).toBeEnabled();
});
