// Flächenangriffe der Bosse (seit dem Rebalance nach Tag 7): Markierungen, Vorwarnzeit, Treffer, gemeinsame Welt.
import { expect, test } from '@playwright/test';
import {
  act, createGame, createWorld, creatureAt, creatureTurn, damageFrom, hitWorld, isFree, markAt, newCreature, stepWorld,
  takeBite, tileAt,
} from '../../src/game.js';
import { CREATURES } from '../../content/creatures.js';
import { MAPS } from '../../content/world.js';

const arena = (type) => {
  const map = Object.keys(MAPS).find((id) => MAPS[id].spawns.some((sp) => sp.type === type));
  const spawn = MAPS[map].spawns.find((sp) => sp.type === type);
  const s = createGame({ seed: 4 });
  s.flags.eventsHeard = { all: true };
  s.map = map;
  const boss = newCreature(type, spawn.x, spawn.y);
  s.creatures = [boss];
  s.player.maxHp = 999;
  s.player.hp = 999;
  return { s, boss, def: CREATURES[type] };
};

test('Jeder Flächenangriff nennt eine Markierung, die es gibt, und ist fair', () => {
  for (const [type, def] of Object.entries(CREATURES)) {
    if (!def.aoe) continue;
    const mark = CREATURES[def.aoe.mark];
    expect(mark?.mark, `${type}: aoe.mark`).toBe(true);
    expect(def.aoe.warn).toBeGreaterThanOrEqual(1);
    expect(def.aoe.every).toBeGreaterThan(def.aoe.warn);
    for (const p of def.aoe.patterns) {
      expect(['cross', 'ring', 'area']).toContain(p.shape);
      // Wer direkt daneben steht, kommt in warn Runden heraus (ein Feld pro Runde).
      const escape = p.shape === 'ring' ? 0 : p.shape === 'cross' ? 1 : p.size;
      expect(escape, `${type}: ${p.shape} ${p.size}`).toBeLessThanOrEqual(def.aoe.warn);
    }
  }
});

test('Der Great Cog markiert Felder, warnt und trifft nach der Vorwarnzeit nur, wer darauf steht', () => {
  const { s, boss, def } = arena('great-cog');
  s.player.x = boss.x;
  s.player.y = boss.y - 1;
  s.turn = 0;
  creatureTurn(s, boss, { ...def, hitChance: 0 });
  const marks = s.creatures.filter((c) => c.type === def.aoe.mark);
  expect(marks.length).toBeGreaterThan(4);
  expect(markAt(s, boss.x, boss.y - 1)).toBeTruthy(); // Kreuz: direkt daneben ist markiert
  expect(s.log.at(-1).text).toBe(def.aoe.warnText);
  for (const m of marks) expect(tileAt(s.map, m.x, m.y).walkable).toBe(true);
  // Markierungen blockieren nichts und lassen sich nicht schlagen.
  expect(creatureAt(s, boss.x, boss.y - 2)).toBeUndefined();
  expect(isFree(s, boss.x, boss.y - 2)).toBe(true);
  // Vor der Zeit passiert nichts.
  s.turn = 1;
  for (const m of marks) creatureTurn(s, m, CREATURES[m.type]);
  expect(s.player.hp).toBe(999);
  // Zur Zeit trifft es, wer darauf steht, mit voller Wucht.
  s.turn = def.aoe.warn;
  for (const m of marks) creatureTurn(s, m, CREATURES[m.type]);
  expect(s.player.hp).toBe(999 - damageFrom(s, CREATURES[def.aoe.mark]));
  expect(marks.every((m) => m.spent)).toBe(true);
});

test('Wer herunter tritt, bleibt heil, und abgelaufene Markierungen verschwinden', () => {
  const { s, boss, def } = arena('great-cog');
  s.player.x = boss.x;
  s.player.y = boss.y - 1;
  s.turn = 0;
  creatureTurn(s, boss, { ...def, hitChance: 0 });
  const count = s.creatures.length;
  expect(count).toBeGreaterThan(1);
  s.player.x = boss.x + 1;
  s.player.y = boss.y - 1; // schräg daneben: nicht im Kreuz
  expect(markAt(s, s.player.x, s.player.y)).toBeUndefined();
  s.turn = def.aoe.warn - 1;
  s.creatures = s.creatures.filter((c) => c !== boss);
  act(s, 'wait'); // Runde warn: Markierungen lösen aus
  expect(s.player.hp).toBe(999);
  act(s, 'wait');
  expect(s.creatures.some((c) => CREATURES[c.type]?.mark)).toBe(false);
});

test('Allein rundenweise: Der Boss markiert in seinem Zug von selbst', () => {
  const { s, boss, def } = arena('crumb-heap');
  s.player.x = boss.x - 1;
  s.player.y = boss.y;
  s.turn = def.aoe.every - 1;
  act(s, 'wait');
  expect(s.creatures.some((c) => c.type === def.aoe.mark)).toBe(true);
});

test('Ein Boss markiert nicht, wenn niemand in der Nähe ist', () => {
  const { s, boss, def } = arena('overwound-clock');
  s.player.x = 2;
  s.player.y = 6;
  s.turn = 0;
  creatureTurn(s, boss, def);
  expect(s.creatures).toHaveLength(1);
});

test('Markierungen zerbrechen WARD', () => {
  const s = createGame({ seed: 2 });
  s.player.bag.push('tome-ward', 'ink');
  s.player.maxHp = 99;
  s.player.hp = 99;
  act(s, 'cast:ward');
  takeBite(s, 'cog-teeth');
  expect(s.player.hp).toBe(99);
  expect(s.player.ward).toBe(0);
});

test('Gemeinsame Welt: Markierungen bekommen eine id und treffen den Spieler, der darauf steht', () => {
  const world = createWorld('clocktower', 3);
  world.creatures = world.creatures.filter((c) => c.type === 'great-cog');
  const cog = world.creatures[0];
  const def = CREATURES['great-cog'];
  world.turn = 2 * def.aoe.every - 1; // nächster Takt: Kreuz (erstes Muster)
  const onMark = { id: 'a', x: cog.x, y: cog.y - 2 };
  const away = { id: 'b', x: cog.x + 1, y: cog.y - 1 };
  stepWorld(world, [onMark, away]);
  const marks = world.creatures.filter((c) => c.type === def.aoe.mark);
  expect(marks.length).toBeGreaterThan(0);
  for (const m of marks) expect(m.id).toMatch(/^c\d{1,6}$/);
  let bites = [];
  for (let i = 0; i < def.aoe.warn; i += 1) bites = bites.concat(stepWorld(world, [onMark, away]));
  expect(bites.filter((b) => b.type === def.aoe.mark).map((b) => b.id)).toEqual(['a']);
  stepWorld(world, [onMark, away]);
  expect(world.creatures.some((c) => c.type === def.aoe.mark && c.respawnAt === null && c.fireAt <= world.turn - 1)).toBe(false);
  // Treffer auf eine Markierung gehen ins Leere: Sie ist keine Kreatur.
  expect(hitWorld(world, 'c99999', 5, onMark)).toBe(null);
});
