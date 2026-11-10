// Grundlagen der Spiellogik ohne DOM: Tag, Event, Zufall, Log, Gelände und Objekte auf der Karte.
// Alle Module der Spiellogik bauen darauf auf; nach außen geht alles über src/game.js.
import { MAPS } from '../content/world.js';
import { TILES } from '../content/tiles.js';
import { CHRONICLE } from '../content/chronicle.js';
import { EVENT } from '../content/event.js';

export const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const LOG_LIMIT = 50;

export const currentDay = () => CHRONICLE[CHRONICLE.length - 1].day;

// Das laufende Community-Event oder null.
export const activeEvent = (day = currentDay()) =>
  (EVENT && day >= EVENT.startDay && day <= EVENT.endDay ? EVENT : null);

// Eigener Zufall mit Seed (mulberry32), damit Abläufe in Tests wiederholbar sind.
export function random(s) {
  s.seed = (s.seed + 0x6d2b79f5) | 0;
  let t = s.seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function log(s, text, kind = '') {
  s.log.push({ text, kind });
  if (s.log.length > LOG_LIMIT) s.log.shift();
}

export function tileAt(mapId, x, y) {
  const row = MAPS[mapId].tiles[y];
  return TILES[row?.[x] ?? ' '] ?? TILES[' '];
}

// Aufgehobene Gegenstände verschwinden dauerhaft von der Karte.
export const visibleEntities = (s) =>
  MAPS[s.map].entities.filter((e) => !s.flags.taken?.[e.id]);

export const entityAt = (s, x, y) =>
  visibleEntities(s).find((e) => e.x === x && e.y === y);

export const distance = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

// Schaden eines Schlags nach Abzug der Abwehr (seit dem Rebalance nach Tag 7): Rüstung und Panzer fangen
// höchstens die Hälfte eines Schlags ab. Sonst wird man ab einer bestimmten Rüstung von nichts mehr verletzt.
export const mitigate = (atk, def = 0) => Math.max(Math.ceil(atk / 2), atk - def, 1);
