// Schreibt timelapse/days.js: pro archivierter Nacht Chronik-Eintrag und die ganze Welt als Daten
// (Karten, Gelände, Figuren), aus denen die Zeitraffer-Seite eine Weltkarte zeichnet.
// Aufruf: node .github/scripts/timelapse-days.mjs _site     (ohne Abhängigkeiten, kein Browser nötig)
import { readdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const SITE = resolve(process.argv[2] ?? '_site');
const load = (dir, file) => import(pathToFileURL(join(SITE, 'day', dir, 'content', file)).href);

const dayDirs = (await readdir(join(SITE, 'day')).catch(() => []))
  .filter((name) => /^\d{3}$/.test(name))
  .sort();

// Nur, was die Karte braucht: keine Dialoge, keine Spielwerte.
function worldData({ MAPS = {}, START = null }, { TILES = {} }, { CREATURES = {} }) {
  const used = new Set([' ']);
  const maps = {};
  for (const [id, map] of Object.entries(MAPS)) {
    for (const row of map.tiles) for (const char of row) used.add(char);
    const figures = [];
    for (const s of map.spawns ?? []) {
      const def = CREATURES[s.type];
      if (def) figures.push({ x: s.x, y: s.y, glyph: def.glyph, color: def.color });
    }
    for (const e of map.entities ?? []) figures.push({ x: e.x, y: e.y, glyph: e.glyph, color: e.color });
    const doors = (map.entities ?? [])
      .filter((e) => e.to?.map)
      .map((e) => ({ x: e.x, y: e.y, to: { map: e.to.map, x: e.to.x, y: e.to.y } }));
    maps[id] = { name: map.name ?? id, tiles: map.tiles, figures, doors };
  }
  const tiles = {};
  for (const char of used) {
    const t = TILES[char];
    if (t) tiles[char] = { glyph: t.glyph, fg: t.fg, bg: t.bg };
  }
  return { start: START, maps, tiles };
}

const days = [];
for (const dir of dayDirs) {
  const day = Number(dir);
  try {
    const { CHRONICLE } = await load(dir, 'chronicle.js');
    const entry = CHRONICLE.find((item) => item.day === day) ?? CHRONICLE.at(-1);
    const [world, tiles, creatures] = await Promise.all([
      load(dir, 'world.js'),
      load(dir, 'tiles.js'),
      load(dir, 'creatures.js').catch(() => ({})),
    ]);
    days.push({ day, date: entry.date, title: entry.title, text: entry.text, world: worldData(world, tiles, creatures) });
    console.log(`Tag ${day}: ${entry.title} (${Object.keys(world.MAPS ?? {}).length} Gebiete)`);
  } catch (error) {
    // Eine kaputte alte Nacht soll den Zeitraffer nicht verhindern.
    console.log(`Tag ${day} übersprungen: ${error.message}`);
  }
}

await writeFile(
  join(SITE, 'timelapse', 'days.js'),
  `// Erzeugt beim Deploy.\nexport const DAYS = ${JSON.stringify(days)};\n`,
);
console.log(`${days.length} Nächte.`);
