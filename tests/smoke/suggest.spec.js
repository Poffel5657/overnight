// Das Formular sperrt sich nach einem Vorschlag bis zur nächsten Nacht in Berlin.
import { expect, test } from '@playwright/test';

const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date());

const open = async (page) => {
  // Captcha und Worker bleiben im Test außen vor.
  await page.route('https://challenges.cloudflare.com/**', (route) => route.abort());
  await page.goto('/?seed=7');
  await page.waitForFunction(() => window.__overnight);
  await page.click('[aria-controls="panel-shape"]');
  await page.click('#open-suggest');
};

test('Nach einem Vorschlag heute bleibt das Formular zu', async ({ page }) => {
  await page.addInitScript((day) => localStorage.setItem('overnight.suggested', day), today());
  await open(page);
  await expect(page.locator('#suggest-send')).toBeHidden();
  await expect(page.locator('#suggest-status')).toContainText('already sent');
});

test('Ein Vorschlag von gestern sperrt nicht mehr', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('overnight.suggested', '2000-01-01'));
  await open(page);
  await expect(page.locator('#suggest-send')).toBeVisible();
  await expect(page.locator('#suggest-status')).toHaveText('');
});
