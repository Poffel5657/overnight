// Lebensbalken über Gegnern: nur bei Verletzten und Bossen, Farbe nach Rest-HP, wirklich auf dem Canvas.
import { expect, test } from '@playwright/test';

test('hpBar: wann ein Balken nötig ist und welche Farbe er hat', async ({ page }) => {
  await page.goto('/?seed=7');
  const bars = await page.evaluate(async () => {
    const { hpBar } = await import('/src/render.js');
    return {
      full: hpBar(2, 2),
      fullBoss: hpBar(30, 30, true),
      half: hpBar(1, 2),
      low: hpBar(1, 5),
      dead: hpBar(0, 5),
    };
  });
  expect(bars.full).toBeNull();
  expect(bars.fullBoss).toEqual({ ratio: 1, color: '#9ccf6a' });
  expect(bars.half).toEqual({ ratio: 0.5, color: '#ffb347' });
  expect(bars.low).toEqual({ ratio: 0.2, color: '#e05a47' });
  expect(bars.dead).toBeNull();
});

test('Verletzte Gegner bekommen einen roten Balken auf der Karte', async ({ page }) => {
  await page.addInitScript(() => {
    window.WebSocket = class { addEventListener() {} send() {} close() {} };
  });
  await page.goto('/?seed=7');
  await page.waitForFunction(() => window.__overnight?.state.creatures.length > 0);
  // Exakt die Farbe des roten Balkens zählen (224, 90, 71).
  const redPixels = () => page.evaluate(() => {
    const canvas = document.getElementById('world');
    const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    let n = 0;
    for (let i = 0; i < data.length; i += 4) if (data[i] === 224 && data[i + 1] === 90 && data[i + 2] === 71) n += 1;
    return n;
  });
  await page.evaluate(() => window.__overnight.act('wait'));
  const before = await redPixels();
  await page.evaluate(() => {
    for (const c of window.__overnight.state.creatures) c.hp *= 0.25;
    window.__overnight.act('wait');
  });
  expect(await redPixels()).toBeGreaterThan(before + 30);
});
