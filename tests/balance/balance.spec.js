// Der Probespieler (seit dem großen Rebalance nach Tag 7): Jede Kreatur muss zu ihrer Rolle aus
// content/balance.js passen. Scheitert das, ist die Kreatur zu leicht oder zu schwer, nicht der Test.
// Den ganzen Bericht gibt es mit: node tests/balance/report.mjs
import { expect, test } from '@playwright/test';
import { CREATURES } from '../../content/creatures.js';
import { ROLES, STAGES } from '../../content/balance.js';
import { ITEMS } from '../../content/items.js';
import { act, createGame, damageFrom, damageTo, mitigate } from '../../src/game.js';
import { judge, playerFor } from './probe.js';

test('Jede Kreatur hat eine Rolle und eine Stufe, die es gibt', () => {
  for (const [type, def] of Object.entries(CREATURES)) {
    expect(ROLES[def.balance?.role], `${type}: balance.role`).toBeTruthy();
    expect(STAGES[def.balance?.stage], `${type}: balance.stage`).toBeTruthy();
  }
});

test('Die Stufen nennen nur Dinge, die es gibt, und Rüstung am richtigen Platz', () => {
  for (const [id, stage] of Object.entries(STAGES)) {
    for (const item of [stage.weapon, ...(stage.armor ?? []), ...(stage.bag ?? [])].filter(Boolean)) {
      expect(ITEMS[item], `${id}: ${item}`).toBeTruthy();
    }
    const s = playerFor(id);
    expect(s.player.level).toBe(stage.level);
    for (const item of stage.armor ?? []) expect(Object.values(s.player.armor)).toContain(item);
  }
});

test('Rüstung fängt höchstens die Hälfte eines Schlags ab, in beide Richtungen', () => {
  expect(mitigate(10, 0)).toBe(10);
  expect(mitigate(10, 3)).toBe(7);
  expect(mitigate(10, 9)).toBe(5);
  expect(mitigate(5, 9)).toBe(3);
  expect(mitigate(1, 5)).toBe(1);
  const s = playerFor('clocktower');
  s.player.armor = { head: 'brass-helm', body: 'crow-coat', feet: 'brass-greaves' };
  s.player.skills = { ...s.player.skills, thick: 3 };
  expect(damageFrom(s, CREATURES['great-cog'])).toBe(Math.ceil(CREATURES['great-cog'].atk / 2));
  expect(damageTo(s, 'great-cog')).toBeGreaterThan(0);
});

test('Trinken kostet eine Runde', () => {
  const s = createGame({ seed: 3 });
  s.creatures = [];
  s.player.bag.push('tonic');
  s.player.hp = 2;
  const turn = s.turn;
  expect(act(s, 'use:tonic')).toBe(true);
  expect(s.turn).toBe(turn + 1);
  expect(s.player.hp).toBe(2 + ITEMS.tonic.heal);
  expect(act(s, 'use:tonic')).toBe(false);
});

for (const type of Object.keys(CREATURES)) {
  test(`Probespieler gegen ${type}`, () => {
    const result = judge(type, { runs: 40 });
    expect(result.problems, result.problems.join('\n')).toEqual([]);
  });
}
