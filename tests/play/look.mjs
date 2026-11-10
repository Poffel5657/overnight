// Hinschauen (seit Chris' Regeln nach Tag 7): Bildschirmfotos des echten Spiels, am Handy und am Rechner,
// damit der Nightwright sieht, was Spieler sehen. Danach jedes Bild ansehen (Read auf die PNG-Datei).
//
//   node tests/play/look.mjs <name> [--stage mainspring] [--map town --x 5 --y 6] [--bag tonic,ink]
//                                   [--do up,up,right] [--open bag|chara|shop] [--out test-results/look]
//
//   name     Dateiname der Bilder (<name>-phone.png, <name>-desktop.png)
//   --stage  Spieler wie in content/balance.js (Stufe, Ausrüstung, Beutel); ohne: neues Spiel
//   --map/--x/--y  hier steht der Spieler (Kreaturen der Karte werden frisch gesetzt)
//   --bag    zusätzliche Dinge in den Beutel
//   --do     Spielzüge über act() in dieser Reihenfolge (wie Tasten: up, down, left, right, wait, use:<id>, cast:<id>)
//   --open   ein Fenster öffnen (Knopf BAG oder CHARA; shop öffnet sich durch Hineinlaufen in einen Stand)
//   --out    Ordner für die Bilder (Standard test-results/look, nicht eingecheckt)
//
// Der Browser kommt aus Playwright (wie bei npm test). PLAYWRIGHT_BROWSERS_PATH gilt wie dort.
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const args = process.argv.slice(2);
const name = args[0] && !args[0].startsWith('--') ? args[0] : 'look';
const opt = (key) => {
  const i = args.indexOf(`--${key}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const out = opt('out') ?? 'test-results/look';
const setup = {
  stage: opt('stage') ?? null,
  map: opt('map') ?? null,
  x: opt('x') !== undefined ? Number(opt('x')) : null,
  y: opt('y') !== undefined ? Number(opt('y')) : null,
  bag: (opt('bag') ?? '').split(',').filter(Boolean),
  moves: (opt('do') ?? '').split(',').filter(Boolean),
};
const open = opt('open');

await mkdir(out, { recursive: true });
const server = spawn(process.execPath, ['tests/smoke/serve.mjs'], { stdio: 'ignore' });
await new Promise((resolve) => setTimeout(resolve, 400));

const browser = await chromium.launch();
const shots = [];
try {
  for (const [device, viewport] of [['phone', { width: 390, height: 844 }], ['desktop', { width: 1280, height: 900 }]]) {
    const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('http://127.0.0.1:4173/?seed=7');
    await page.waitForFunction(() => window.__overnight);
    await page.evaluate(async (setup) => {
      const g = await import('/src/game.js');
      const s = window.__overnight.state;
      s.flags.eventsHeard = { all: true };
      if (setup.stage) {
        const { playerFor } = await import('/tests/balance/probe.js');
        const p = playerFor(setup.stage);
        Object.assign(s.player, p.player, { x: s.player.x, y: s.player.y });
      }
      s.player.bag.push(...setup.bag);
      if (setup.map) g.enterMap(s, setup.map, setup.x ?? s.player.x, setup.y ?? s.player.y);
      for (const move of setup.moves) window.__overnight.act(move);
      window.__overnight.act('wait');
    }, setup);
    // Hinweisfenster eines Events schließen, damit man die Karte sieht.
    for (const button of await page.locator('dialog[open] button').all()) {
      if (/got it/i.test(await button.textContent())) await button.click();
    }
    if (open === 'bag' || open === 'chara') await page.click(`#open-${open}`);
    await page.waitForTimeout(250);
    const file = join(out, `${name}-${device}.png`);
    await page.screenshot({ path: file, fullPage: true });
    shots.push(file);
    if (errors.length) console.log(`Fehler im Browser (${device}): ${errors.join(' | ')}`);
    await page.close();
  }
} finally {
  await browser.close();
  server.kill();
}
console.log(shots.join('\n'));
console.log('Jetzt jedes Bild ansehen: Ist alles lesbar, bedienbar, nichts abgeschnitten oder verdeckt?');
