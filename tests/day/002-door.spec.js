// Tag 2: Eine braune Tür in der Lücke im Osten führt in den Rough Draft und wieder zurück.
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { act, createGame, entityAt, tileAt, activeEvent } from '../../src/game.js';
import { MAPS } from '../../content/world.js';

const quietGame = (x, y, saved = null) => {
  const s = createGame({ seed: 1, saved });
  // Ein laufendes Event gilt als schon gehört, damit Figuren hier ihre normalen Sätze sagen.
  const event = activeEvent();
  if (event) s.flags.eventsHeard = { [event.id]: true };
  s.creatures = [];
  s.player.x = x;
  s.player.y = y;
  return s;
};

test('Die Tür im Osten führt in den Rough Draft', () => {
  const s = quietGame(22, 8);
  expect(entityAt(s, 23, 8)?.kind).toBe('door');
  expect(act(s, 'right')).toBe(true);
  expect(s.map).toBe('draft');
  expect([s.player.x, s.player.y]).toEqual([2, 6]);
  expect(s.log.at(-1).text).toContain('brown door');
  expect(s.creatures.length).toBe(MAPS.draft.spawns.length);
});

test('Die Tür im Westen führt zurück auf die Wiese', () => {
  const s = quietGame(22, 8);
  act(s, 'right');
  s.creatures = [];
  act(s, 'left');
  expect(s.map).toBe('meadow');
  expect([s.player.x, s.player.y]).toEqual([22, 8]);
});

test('Jede Tür zeigt auf ein begehbares, freies Feld einer bekannten Karte', () => {
  for (const map of Object.values(MAPS)) {
    for (const door of map.entities.filter((e) => e.kind === 'door')) {
      expect(MAPS[door.to.map]).toBeDefined();
      expect(tileAt(door.to.map, door.to.x, door.to.y).walkable).toBe(true);
      const s = createGame({ seed: 1 });
      s.map = door.to.map;
      expect(entityAt(s, door.to.x, door.to.y)).toBeUndefined();
    }
  }
});

test('Bleistiftlinien sind nicht begehbar und kosten keine Runde', () => {
  const s = quietGame(13, 1);
  s.map = 'draft';
  expect(act(s, 'right')).toBe(false);
  expect(s.log.at(-1).text).toContain('sketched');
  expect(s.turn).toBe(0);
});

test('Die Vogelscheuche redet und bemerkt den Stock', () => {
  const s = quietGame(11, 5);
  s.map = 'draft';
  s.player.weapon = 'stick';
  act(s, 'right');
  act(s, 'right');
  expect(s.log[0].text).toContain('sticks myself');
  expect(s.log[1].text).toContain('hat first');
});

test('Wer im Rough Draft umkippt, wacht im Bett auf der Wiese auf', () => {
  const s = quietGame(22, 8);
  act(s, 'right');
  const rat = s.creatures[0];
  s.creatures = [rat];
  s.player.hp = 1;
  for (let i = 0; i < 60 && s.stats.faints === 0; i += 1) {
    rat.x = s.player.x + 1;
    rat.y = s.player.y;
    act(s, 'wait');
  }
  expect(s.stats.faints).toBe(1);
  expect(s.map).toBe('meadow');
});

test('Ein Spielstand im Rough Draft lädt dort wieder', () => {
  const saved = JSON.parse(readFileSync('tests/fixtures/save-v1-day2-draft.json', 'utf8'));
  const s = createGame({ seed: 1, saved });
  expect(s.map).toBe('draft');
  expect([s.player.x, s.player.y]).toEqual([6, 6]);
  expect(s.creatures.every((c) => MAPS.draft.spawns.some((sp) => sp.x === c.x && sp.y === c.y))).toBe(true);
});
