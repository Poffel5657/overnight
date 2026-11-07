// Macht beim Deploy ein Bild pro archivierter Nacht (nur noch für das Vorschaubild og.png).
// Die Weltkarten der Zeitraffer-Seite kommen aus timelapse-days.mjs.
// Aufruf: node .github/scripts/timelapse.mjs _site
// Jede Nacht wird in einem frischen Browser geöffnet, also so, wie ein neuer Spieler sie zuerst sah.
import { createServer } from 'node:http';
import { readFile, readdir, mkdir } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { chromium } from '@playwright/test';

const SITE = resolve(process.argv[2] ?? '_site');
const PORT = 4180;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};

const server = createServer(async (request, response) => {
  const { pathname } = new URL(request.url, 'http://localhost');
  const path = normalize(join(SITE, decodeURIComponent(pathname)));
  if (path !== SITE && !path.startsWith(SITE + sep)) return response.writeHead(403).end();
  const file = pathname.endsWith('/') ? join(path, 'index.html') : path;
  try {
    const body = await readFile(file);
    response.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise((done) => server.listen(PORT, '127.0.0.1', done));

const dayDirs = (await readdir(join(SITE, 'day')).catch(() => []))
  .filter((name) => /^\d{3}$/.test(name))
  .sort();

await mkdir(join(SITE, 'timelapse', 'shots'), { recursive: true });
// Lokal kann CHROMIUM_PATH auf einen vorhandenen Browser zeigen.
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
let count = 0;

for (const dir of dayDirs) {
  const day = Number(dir);
  try {
    // reducedMotion: keine Bootsequenz, die über der Karte liegen könnte.
    const context = await browser.newContext({ viewport: { width: 900, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    const page = await context.newPage();
    // Kein Netzwerk nach außen, auch nicht für Captcha oder Worker.
    await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) => route.abort());
    await page.goto(`http://127.0.0.1:${PORT}/day/${dir}/?seed=1`);
    await page.waitForFunction(() => window.__overnight, null, { timeout: 10000 });
    await page.waitForTimeout(300);
    const shot = `shots/${dir}.png`;
    await page.locator('#world').screenshot({ path: join(SITE, 'timelapse', shot) });
    await context.close();
    count += 1;
    console.log(`Tag ${day}: Bild`);
  } catch (error) {
    // Eine kaputte alte Nacht soll den Zeitraffer nicht verhindern.
    console.log(`Tag ${day} übersprungen: ${error.message}`);
  }
}

await browser.close();
server.close();
console.log(`${count} Bilder.`);
