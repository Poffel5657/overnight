// Oberfläche: Layout auf Handy und PC, Terminal-Effekte blockieren nichts.
import { expect, test } from '@playwright/test';

const open = async (page) => {
  await page.route('https://challenges.cloudflare.com/**', (route) => route.abort());
  await page.goto('/?seed=7');
  await page.waitForFunction(() => window.__overnight);
};

const noSideScroll = async (page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

test('Handy: kein seitliches Scrollen, Karte und Steuerkreuz im ersten Bildschirm', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  // Lange Logzeilen, die umbrechen, dürfen das Steuerkreuz nicht aus dem Bild schieben.
  await page.evaluate(() => {
    const { state, act } = window.__overnight;
    for (let i = 0; i < 5; i += 1) state.log.push({ text: 'A very long line that wraps around twice on a small phone screen, at least.', kind: '' });
    act('wait');
  });
  expect(await noSideScroll(page)).toBe(true);
  for (const selector of ['#world', '.pad']) {
    const box = await page.locator(selector).boundingBox();
    expect(box).not.toBeNull();
    expect(box.y + box.height).toBeLessThanOrEqual(844);
  }
  await expect(page.locator('.pad')).toBeVisible();
});

test('PC: zwei Spalten, Seitenleiste neben der Karte', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await open(page);
  expect(await noSideScroll(page)).toBe(true);
  const map = await page.locator('#world').boundingBox();
  const side = await page.locator('.side').boundingBox();
  expect(side.x).toBeGreaterThan(map.x + map.width - 1);
  await expect(page.locator('.pad')).toBeHidden();
});

test('Bootsequenz blockiert weder Tasten noch Klicks', async ({ page }) => {
  await open(page);
  const before = await page.evaluate(() => window.__overnight.state.turn);
  await page.keyboard.press(' ');
  expect(await page.evaluate(() => window.__overnight.state.turn)).toBe(before + 1);
  await page.click('#open-chronicle');
  await expect(page.locator('#chronicle-dialog')).toBeVisible();
  await expect(page.locator('#boot')).toBeHidden();
});

test('CRT-Schalter bleibt nach dem Neuladen erhalten', async ({ page }) => {
  await open(page);
  await expect(page.locator('html')).toHaveClass(/crt-on/);
  await page.click('#crt-toggle');
  await expect(page.locator('#crt-toggle')).toHaveText('CRT: OFF');
  await page.reload();
  await page.waitForFunction(() => window.__overnight);
  await expect(page.locator('html')).not.toHaveClass(/crt-on/);
});

test('Countdown und Fenster TONIGHT sind gefüllt', async ({ page }) => {
  await open(page);
  await expect(page.locator('#countdown')).toHaveText(/^(\d{2}:\d{2}:\d{2})?$/);
  await expect(page.locator('#tonight-title')).toHaveText(/^Day \d+: .+/);
  await expect(page.locator('#hp-meter')).toContainText('HP [');
});
