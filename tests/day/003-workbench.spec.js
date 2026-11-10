// Tag 3: Ein spitzer Stein im Teich, eine Werkbank an der Hütte und daraus ein Steinspeer.
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { act, attackOf, craft, createGame, entityAt, hasItem, tileAt, activeEvent } from '../../src/game.js';

const quietGame = (x, y, saved = null) => {
  const s = createGame({ seed: 1, saved });
  // Ein laufendes Event gilt als schon gehört, damit Figuren hier ihre normalen Sätze sagen.
  const event = activeEvent();
  if (event) s.flags.eventsHeard = { [event.id]: true };
  // Das Geschenk der Vogelscheuche (seit Tag 6) gilt als schon erhalten, damit sie ihre Sätze sagt.
  s.flags.gifts = { scarecrow: true };
  s.creatures = [];
  s.player.x = x;
  s.player.y = y;
  return s;
};

test('Der spitze Stein liegt im Teich und kommt in den Beutel', () => {
  const s = quietGame(17, 5);
  expect(tileAt('meadow', 18, 5).name).toBe('shallows');
  expect(tileAt('meadow', 19, 5).name).toBe('water');
  expect(entityAt(s, 18, 5)?.item).toBe('pointy-rock');
  expect(act(s, 'right')).toBe(true);
  expect(s.player.bag).toEqual(['pointy-rock']);
  expect(s.player.weapon).toBe(null);
  expect(entityAt(s, 18, 5)).toBeUndefined();
  expect([s.player.x, s.player.y]).toEqual([17, 5]);
  act(s, 'right');
  expect([s.player.x, s.player.y]).toEqual([18, 5]);
});

test('Die Werkbank ohne passende Dinge tut nichts', () => {
  const s = quietGame(11, 6);
  expect(entityAt(s, 10, 6)?.kind).toBe('bench');
  act(s, 'left');
  expect(s.log.at(-1).text).toContain('nothing to work on');
  s.player.weapon = 'stick';
  act(s, 'left');
  expect(s.log.at(-1).text).toContain('second');
  expect(s.player.weapon).toBe('stick');
});

test('Stock und Stein werden an der Werkbank zum Steinspeer', () => {
  const s = quietGame(20, 7);
  act(s, 'down'); // Stock auf (20, 8)
  expect(s.player.weapon).toBe('stick');
  s.player.x = 17;
  s.player.y = 5;
  act(s, 'right'); // Stein auf (18, 5)
  expect(hasItem(s, 'pointy-rock')).toBe(true);
  s.player.x = 11;
  s.player.y = 6;
  act(s, 'left');
  // Seit Tag 8 öffnet die Werkbank ein Fenster, dort wählt man das Rezept.
  expect(s.openBench).toBe('bench');
  expect(s.log.at(-1).text).toContain('stone spear');
  expect(craft(s, 'stone-spear')).toBe(true);
  expect(s.player.weapon).toBe('stone-spear');
  expect(s.player.bag).toEqual([]);
  expect(attackOf(s)).toBe(4);
  expect(s.log.at(-1).text).toContain('jab things for 4 damage');
});

test('Der Speer erledigt eine Ratte mit einem Stoß', () => {
  const s = quietGame(5, 5);
  s.player.weapon = 'stone-spear';
  const fresh = createGame({ seed: 1 });
  const rat = fresh.creatures[0];
  rat.x = 6;
  rat.y = 5;
  s.creatures = [rat];
  act(s, 'right');
  expect(s.stats.kills).toBe(1);
  expect(s.log.some((l) => l.text.includes('You jab the rat'))).toBe(true);
});

test('Keeper und Vogelscheuche bemerken den Speer', () => {
  const s = quietGame(11, 5);
  s.player.weapon = 'stone-spear';
  act(s, 'right');
  expect(s.log.at(-1).text).toContain('weapons industry');
  const d = quietGame(11, 5);
  d.map = 'draft';
  d.player.weapon = 'stone-spear';
  act(d, 'right');
  expect(d.log.at(-1).text).toContain('workbench');
});

test('Alte Spielstände ohne Beutel bekommen einen leeren Beutel', () => {
  const saved = JSON.parse(readFileSync('tests/fixtures/save-v1-day2-draft.json', 'utf8'));
  const s = createGame({ seed: 1, saved });
  expect(s.player.bag).toEqual([]);
  expect(s.player.weapon).toBe('stick');
});

test('Ein Spielstand mit Stein im Beutel kann direkt den Speer bauen', () => {
  const saved = JSON.parse(readFileSync('tests/fixtures/save-v1-day3-bag.json', 'utf8'));
  const s = createGame({ seed: 1, saved });
  s.creatures = [];
  expect(s.player.bag).toEqual(['pointy-rock']);
  expect(entityAt(s, 18, 5)).toBeUndefined();
  act(s, 'left');
  craft(s, 'stone-spear');
  expect(s.player.weapon).toBe('stone-spear');
});
