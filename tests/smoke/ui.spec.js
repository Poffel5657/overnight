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

for (const viewport of [{ width: 1280, height: 800 }, { width: 1920, height: 1080 }, { width: 900, height: 1100 }]) {
  test(`Karte füllt den Bildschirm ohne Scrollen bei ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await open(page);
    expect(await noSideScroll(page)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBe(true);
    const map = await page.locator('#world').boundingBox();
    const frame = await page.locator('.map-frame').boundingBox();
    // Die Karte stößt an mindestens einer Seite an den Rahmen und ist nicht verzerrt.
    const fillsWidth = map.width >= frame.width - 2;
    const fillsHeight = map.height >= frame.height - 2;
    expect(fillsWidth || fillsHeight).toBe(true);
    const ratio = await page.evaluate(() => {
      const canvas = document.getElementById('world');
      return canvas.width / canvas.height;
    });
    expect(Math.abs(map.width / map.height - ratio)).toBeLessThan(0.02);
  });
}

test('Menüs öffnen sich, erklären sich und schließen wieder', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await open(page);
  await expect(page.locator('#open-suggest')).toBeHidden();
  await page.click('[aria-controls="panel-shape"]');
  await expect(page.locator('#panel-shape')).toBeVisible();
  await expect(page.locator('#open-suggest')).toBeVisible();
  await page.click('[aria-controls="panel-archive"]');
  await expect(page.locator('#panel-shape')).toBeHidden();
  await expect(page.locator('#open-chronicle')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#panel-archive')).toBeHidden();
  await page.click('[aria-controls="panel-tonight"]');
  await expect(page.locator('#tonight-title')).toBeVisible();
  await page.mouse.click(5, 790);
  await expect(page.locator('#panel-tonight')).toBeHidden();
});

test('Handy: Steuerkreuz liegt über der Karte, Log lässt sich einklappen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  const map = await page.locator('.map-frame').boundingBox();
  const pad = await page.locator('.pad').boundingBox();
  expect(pad.y).toBeGreaterThanOrEqual(map.y);
  expect(pad.y + pad.height).toBeLessThanOrEqual(map.y + map.height + 1);
  const before = (await page.locator('#world').boundingBox()).height;
  await page.click('#log-toggle');
  await expect(page.locator('#log')).toBeHidden();
  await expect(page.locator('#log-peek')).toBeVisible();
  expect((await page.locator('#world').boundingBox()).height).toBeGreaterThan(before);
  // Das Steuerkreuz bewegt den Spieler weiterhin.
  const turn = await page.evaluate(() => window.__overnight.state.turn);
  await page.click('[data-action="wait"]');
  expect(await page.evaluate(() => window.__overnight.state.turn)).toBe(turn + 1);
  await page.reload();
  await page.waitForFunction(() => window.__overnight);
  await expect(page.locator('#log')).toBeHidden();
  await page.click('#log-toggle');
  await expect(page.locator('#log')).toBeVisible();
});

test('PC: kein Steuerkreuz, Log nicht einklappbar', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await open(page);
  await expect(page.locator('.pad')).toBeHidden();
  await expect(page.locator('#log-toggle')).toBeHidden();
  await expect(page.locator('#log')).toBeVisible();
});

test('Bootsequenz blockiert weder Tasten noch Klicks', async ({ page }) => {
  await open(page);
  const before = await page.evaluate(() => window.__overnight.state.turn);
  await page.keyboard.press(' ');
  expect(await page.evaluate(() => window.__overnight.state.turn)).toBe(before + 1);
  await page.click('[aria-controls="panel-archive"]');
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
  await expect(page.locator('#tonight-title')).toHaveText(/^Day \d+: .+/, { useInnerText: false });
  await expect(page.locator('#hp-meter')).toContainText('HP [');
});
