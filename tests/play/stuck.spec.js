// Niemand sitzt fest (Wartung nach Tag 7): Von jedem begehbaren Feld muss man zu Fuß zurück zu einem Ankunftsort
// der Karte kommen, auch ohne Tinte. Wer eine Nische baut, die man nur mit HOP erreicht, legt ein Einbahnfeld
// (oneWay in content/tiles.js) hinaus. Scheitert dieser Test, braucht die Stelle einen Weg zurück, keine Ausnahme.
import { expect, test } from '@playwright/test';
import { MAPS, START } from '../../content/world.js';
import { TILES } from '../../content/tiles.js';
import { act, activeEvent, createGame, countItem } from '../../src/game.js';

const STEPS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const tile = (map, x, y) => TILES[MAPS[map].tiles[y]?.[x] ?? ' '] ?? TILES[' '];

// Ankunftsorte: Spielstart und alle Ziele von Türen, Brunnen und Ähnlichem, die auf diese Karte führen.
function arrivals(map) {
  const found = map === START.map ? [[START.x, START.y]] : [];
  const scan = (value) => {
    if (!value || typeof value !== 'object') return;
    if (value.map === map && Number.isInteger(value.x) && Number.isInteger(value.y)) found.push([value.x, value.y]);
    Object.values(value).forEach(scan);
  };
  Object.values(MAPS).forEach((m) => m.entities.forEach(scan));
  return found;
}

// Felder, die man von (x, y) aus zu Fuß erreicht. Einbahnfelder nur in ihrer Richtung.
function onFoot(map, x, y) {
  const seen = new Set([`${x},${y}`]);
  const queue = [[x, y]];
  while (queue.length) {
    const [cx, cy] = queue.shift();
    for (const [dir, [dx, dy]] of Object.entries(STEPS)) {
      const nx = cx + dx;
      const ny = cy + dy;
      const t = tile(map, nx, ny);
      if (!(t.walkable || t.oneWay === dir) || seen.has(`${nx},${ny}`)) continue;
      seen.add(`${nx},${ny}`);
      queue.push([nx, ny]);
    }
  }
  return seen;
}

// Felder, die man von den Ankunftsorten aus mit Laufen und beliebig viel HOP erreicht (großzügig: Dinge im
// Mittelfeld werden ignoriert). Reine Deko-Ecken, an die niemand herankommt, sind keine Falle.
function withHop(map, starts) {
  const seen = new Set(starts.map(([x, y]) => `${x},${y}`));
  const queue = [...starts];
  while (queue.length) {
    const [cx, cy] = queue.shift();
    for (const [dir, [dx, dy]] of Object.entries(STEPS)) {
      const mid = tile(map, cx + dx, cy + dy);
      const targets = [];
      if (mid.walkable || mid.oneWay === dir) targets.push([cx + dx, cy + dy]);
      if ((mid.walkable || mid.low) && tile(map, cx + 2 * dx, cy + 2 * dy).walkable) targets.push([cx + 2 * dx, cy + 2 * dy]);
      for (const [nx, ny] of targets) {
        if (seen.has(`${nx},${ny}`)) continue;
        seen.add(`${nx},${ny}`);
        queue.push([nx, ny]);
      }
    }
  }
  return seen;
}

test('Wo man mit HOP hinkommt, kommt man auch ohne Tinte wieder weg', () => {
  for (const map of Object.keys(MAPS)) {
    const starts = arrivals(map);
    expect(starts.length, `${map} hat keinen Ankunftsort`).toBeGreaterThan(0);
    const goals = starts.map(([x, y]) => `${x},${y}`);
    for (const key of withHop(map, starts)) {
      const [x, y] = key.split(',').map(Number);
      const reach = onFoot(map, x, y);
      expect(goals.some((g) => reach.has(g)), `${map} ${key} ist eine Falle`).toBe(true);
    }
  }
});

test('Einbahn: hinaus rutscht man, hinein nicht', () => {
  const quiet = (map, x, y) => {
    const s = createGame({ seed: 1 });
    const event = activeEvent();
    if (event) s.flags.eventsHeard = { [event.id]: true };
    s.map = map;
    s.creatures = [];
    s.player.x = x;
    s.player.y = y;
    return s;
  };
  // Turm: aus der Nische über das schräge Brett zurück in den Raum, ohne Tinte.
  const t = quiet('tower', 14, 4);
  expect(countItem(t, 'ink')).toBe(0);
  expect(act(t, 'left')).toBe(true);
  expect(act(t, 'left')).toBe(true);
  expect([t.player.x, t.player.y]).toEqual([12, 4]);
  expect(act(t, 'right')).toBe(false);
  expect([t.player.x, t.player.y]).toEqual([12, 4]);
  expect(t.log.at(-1).text).toContain('slide');
  // Uhrturm: von der Zahnradinsel die Messingrutsche hinunter.
  const c = quiet('clocktower', 6, 5);
  expect(act(c, 'left')).toBe(true);
  expect(act(c, 'left')).toBe(true);
  expect([c.player.x, c.player.y]).toEqual([4, 5]);
  expect(act(c, 'right')).toBe(false);
  expect([c.player.x, c.player.y]).toEqual([4, 5]);
  // Wiese: aus der Ecke hinter dem Teich über den Trittstein zurück.
  const m = quiet('meadow', 21, 4);
  expect(act(m, 'down')).toBe(true);
  expect(act(m, 'down')).toBe(true);
  expect([m.player.x, m.player.y]).toEqual([21, 6]);
  expect(act(m, 'up')).toBe(false);
  expect([m.player.x, m.player.y]).toEqual([21, 6]);
});
