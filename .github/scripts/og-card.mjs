// Baut beim Deploy das Vorschaubild für geteilte Links (og.png, 1200 x 630) aus der neuesten Nacht.
// Aufruf: node .github/scripts/og-card.mjs _site     (nach timelapse.mjs, das die Kartenbilder macht)
// Scheitert etwas, bleibt das eingecheckte og.png liegen.
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

const SITE = resolve(process.argv[2] ?? '_site');
const b64 = async (path) => (await readFile(path)).toString('base64');
const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const { CHRONICLE } = await import(pathToFileURL(join(SITE, 'content', 'chronicle.js')).href);
const latest = CHRONICLE.at(-1);
const shots = (await readdir(join(SITE, 'timelapse', 'shots')).catch(() => [])).filter((f) => f.endsWith('.png')).sort();
if (!shots.length) {
  console.log('Keine Kartenbilder, og.png bleibt wie es ist.');
  process.exit(0);
}
const shot = await b64(join(SITE, 'timelapse', 'shots', shots.at(-1)));
const font = await b64(join(SITE, 'fonts', 'vt323.woff2'));
const icon = await b64(join(SITE, 'icon.svg'));

const html = `<!doctype html><html><head><style>
  @font-face { font-family: VT323; src: url(data:font/woff2;base64,${font}) format('woff2'); }
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; background: radial-gradient(ellipse at 30% 0%, #241808, #0b0906 60%, #050403);
         font-family: VT323, monospace; color: #ffc773; text-shadow: 0 0 8px rgba(255,170,60,.45); overflow: hidden; }
  .frame { position: absolute; inset: 22px; border: 6px double #5a3f17; padding: 34px 40px; display: flex; gap: 40px; }
  .left { width: 400px; display: flex; flex-direction: column; }
  .brand { display: flex; align-items: center; gap: 18px; font-size: 76px; letter-spacing: 6px; color: #ffe2b0; }
  .brand img { width: 84px; height: 84px; }
  .tag { margin-top: 18px; font-size: 34px; line-height: 1.15; }
  .night { margin-top: auto; font-size: 30px; color: #b08040; }
  .title { font-size: 40px; color: #ffb347; line-height: 1.1; }
  .cta { margin-top: 18px; font-size: 28px; color: #a8d86e; }
  .map { flex: 1; display: flex; align-items: center; }
  .map img { width: 100%; border: 3px solid #5a3f17; box-shadow: 0 0 30px rgba(255,170,60,.18); }
  .scan { position: absolute; inset: 0; background: repeating-linear-gradient(to bottom, transparent 0 2px, rgba(0,0,0,.22) 3px, transparent 4px),
          radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,.55)); }
</style></head><body>
  <div class="frame">
    <div class="left">
      <div class="brand"><img src="data:image/svg+xml;base64,${icon}">OVERNIGHT</div>
      <p class="tag">A tiny RPG that an AI rebuilds every night. You suggest, vote and watch it grow.</p>
      <p class="night">Night ${latest.day}</p>
      <p class="title">${escape(latest.title)}</p>
      <p class="cta">&gt; play tonight's world_</p>
    </div>
    <div class="map"><img src="data:image/png;base64,${shot}"></div>
  </div>
  <div class="scan"></div>
</body></html>`;

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(200);
await writeFile(join(SITE, 'og.png'), await page.screenshot({ type: 'png' }));
await browser.close();
console.log(`og.png: Nacht ${latest.day}, ${shots.at(-1)}`);
