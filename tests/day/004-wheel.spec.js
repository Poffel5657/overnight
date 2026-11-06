// Tag 4: Stufen und Erfahrung, Frösche aus der ausradierten Ecke, der Dealer und sein Glücksrad.
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import {
  act, attackOf, createGame, currentDay, entityAt, nextLevelXp, tileAt, AI_BEHAVIOURS, WHEEL_EFFECTS,
} from '../../src/game.js';
import { CREATURES } from '../../content/creatures.js';
import { WHEEL } from '../../content/wheel.js';
import { LEVELS } from '../../content/levels.js';

const quiet = (map, x, y, seed = 1) => {
  const s = createGame({ seed });
  s.map = map;
  s.creatures = [];
  s.player.x = x;
  s.player.y = y;
  return s;
};

const foe = (type, x, y) => ({
  type, x, y, hp: CREATURES[type].hp, spawn: { x, y }, respawnAt: null, once: false,
});

test('Neues Spiel beginnt auf Stufe 1 ohne Erfahrung', () => {
  const s = createGame({ seed: 1 });
  expect(s.player.level).toBe(1);
  expect(s.player.xp).toBe(0);
  expect(nextLevelXp(s)).toBe(LEVELS[1].xp);
});

test('Ratten geben 1 XP, Frösche 2, und der Aufstieg stärkt und heilt', () => {
  const s = quiet('meadow', 5, 5);
  s.player.weapon = 'stone-spear';
  s.player.hp = 3;
  for (let i = 0; i < 4; i += 1) {
    s.creatures = [foe('rat', 6, 5)];
    act(s, 'right');
  }
  expect(s.player.xp).toBe(4);
  expect(s.player.level).toBe(1);
  s.creatures = [foe('rat', 6, 5)];
  act(s, 'right');
  expect(s.player.level).toBe(2);
  expect(s.player.maxHp).toBe(12);
  expect(s.player.hp).toBe(12);
  expect(s.log.some((l) => l.text.includes('more finished. Level 2'))).toBe(true);
  const frog = foe('frog', 6, 5);
  s.creatures = [frog];
  act(s, 'right');
  act(s, 'right');
  expect(frog.respawnAt).not.toBe(null);
  expect(s.player.xp).toBe(7);
  expect(s.stats.xp).toBe(7);
});

test('Stufe 3 gibt einen Angriffspunkt dazu', () => {
  const s = quiet('meadow', 5, 5);
  s.player.xp = 11;
  s.player.level = 2;
  s.creatures = [foe('rat', 6, 5)];
  act(s, 'right'); // Faust: 1 Schaden, Ratte hat 2
  act(s, 'right');
  expect(s.player.level).toBe(3);
  expect(attackOf(s)).toBe(2);
});

test('Frösche brauchen mit dem Speer zwei Stiche', () => {
  const s = quiet('draft', 5, 5);
  s.player.weapon = 'stone-spear';
  const frog = foe('frog', 6, 5);
  s.creatures = [frog];
  act(s, 'right');
  expect(frog.hp).toBe(1);
  expect(frog.respawnAt).toBe(null);
});

test('Frösche sitzen jede zweite Runde und springen dann zwei Felder', () => {
  const s = quiet('draft', 3, 5);
  const frog = foe('frog', 7, 5);
  s.creatures = [frog];
  s.turn = 1;
  AI_BEHAVIOURS.hop(s, frog, CREATURES.frog);
  expect(frog.x).toBe(7);
  s.turn = 2;
  AI_BEHAVIOURS.hop(s, frog, CREATURES.frog);
  expect(frog.x).toBe(5);
  s.turn = 4;
  AI_BEHAVIOURS.hop(s, frog, CREATURES.frog);
  expect(frog.x).toBe(4);
});

test('Frösche lassen manchmal einen Knopf fallen', () => {
  let buttons = 0;
  for (let seed = 1; seed <= 40; seed += 1) {
    const s = quiet('draft', 5, 5, seed);
    s.player.weapon = 'stone-spear';
    s.player.atk = 5;
    s.creatures = [foe('frog', 6, 5)];
    act(s, 'right');
    buttons += s.player.bag.filter((id) => id === 'button').length;
  }
  expect(buttons).toBeGreaterThan(3);
  expect(buttons).toBeLessThan(25);
});

test('Die ausradierte Ecke, der Dealer und das Rad stehen im Rough Draft', () => {
  const s = quiet('draft', 2, 6);
  expect(tileAt('draft', 12, 10).name).toBe('rubbed out');
  expect(tileAt('draft', 12, 10).walkable).toBe(false);
  expect(entityAt(s, 16, 7)?.id).toBe('dealer');
  expect(entityAt(s, 17, 6)?.kind).toBe('wheel');
  const fresh = createGame({ seed: 1, saved: { map: 'draft', player: { x: 2, y: 6 } } });
  expect(fresh.creatures.filter((c) => c.type === 'frog')).toHaveLength(2);
});

test('Das Rad dreht einmal pro Nacht umsonst, dann nur für einen Knopf', () => {
  const s = quiet('draft', 16, 6);
  act(s, 'right');
  expect(s.flags.wheelDay).toBe(currentDay());
  expect(s.flags.spins).toBe(1);
  expect(s.log.some((l) => l.text === WHEEL.freeText)).toBe(true);
  s.creatures = [];
  s.player.bag = [];
  act(s, 'right');
  expect(s.log.at(-1).text).toBe(WHEEL.emptyText);
  expect(s.flags.spins).toBe(1);
  s.creatures = [];
  s.player.bag = s.player.bag.filter((id) => id !== 'button');
  s.player.bag.push('button');
  act(s, 'right');
  expect(s.flags.spins).toBe(2);
  expect(s.log.some((l) => l.text === WHEEL.paidText)).toBe(true);
});

test('Jedes Feld des Rads wirkt', () => {
  const s = quiet('draft', 5, 5);
  WHEEL_EFFECTS.maxHp(s, { amount: 1 });
  expect(s.player.maxHp).toBe(11);
  s.player.hp = 2;
  WHEEL_EFFECTS.heal(s);
  expect(s.player.hp).toBe(11);
  WHEEL_EFFECTS.xp(s, { amount: 3 });
  expect(s.player.xp).toBe(3);
  WHEEL_EFFECTS.item(s, { item: 'pencil-stub' });
  expect(s.player.bag).toContain('pencil-stub');
  WHEEL_EFFECTS.visitor(s, { creature: 'frog' });
  expect(s.creatures).toHaveLength(1);
  const visitor = s.creatures[0];
  expect(visitor.once).toBe(true);
  // Besucher kommen nach dem Sieg nicht wieder.
  s.player.weapon = 'stone-spear';
  s.player.atk = 5;
  act(s, ['right', 'left', 'down', 'up'][[[1, 0], [-1, 0], [0, 1], [0, -1]]
    .findIndex(([dx, dy]) => visitor.x === 5 + dx && visitor.y === 5 + dy)]);
  expect(s.creatures).toHaveLength(0);
  for (const wedge of WHEEL.wedges) expect(WHEEL_EFFECTS[wedge.effect]).toBeDefined();
});

test('Viele Drehungen bleiben stimmig und den Bleistift gibt es nur einmal', () => {
  const s = quiet('draft', 16, 6, 7);
  s.player.bag = Array(200).fill('button');
  s.player.maxHp = 1000;
  s.player.hp = 1000;
  for (let i = 0; i < 150; i += 1) {
    s.creatures = [];
    act(s, 'right');
  }
  expect(s.player.bag.filter((id) => id === 'pencil-stub').length).toBeLessThanOrEqual(1);
  expect(s.flags.spins).toBe(150);
  expect(s.map).toBe('draft');
  expect(s.player.hp).toBeGreaterThan(0);
});

test('Alte Spielstände ohne Stufe beginnen auf Stufe 1, neue behalten sie', () => {
  const old = JSON.parse(readFileSync('tests/fixtures/save-v1-day3-bag.json', 'utf8'));
  const s = createGame({ seed: 1, saved: old });
  expect(s.player.level).toBe(1);
  expect(s.player.xp).toBe(0);
  expect(s.stats.xp).toBe(0);
  const saved = JSON.parse(readFileSync('tests/fixtures/save-v1-day4-level.json', 'utf8'));
  const t = createGame({ seed: 1, saved });
  expect(t.player.level).toBe(3);
  expect(t.player.bag.filter((id) => id === 'button')).toHaveLength(2);
  expect(attackOf(t)).toBe(5);
});

test('Die Anzeige zeigt Stufe, Erfahrung und gezählte Knöpfe', async ({ page }) => {
  const save = readFileSync('tests/fixtures/save-v1-day4-level.json', 'utf8');
  await page.addInitScript((data) => localStorage.setItem('overnight.save', data), save);
  await page.goto('/?seed=3');
  await page.waitForFunction(() => window.__overnight);
  await expect(page.locator('#hp-label')).toContainText('LV 3 · XP 14/22');
  await expect(page.locator('#hp-label')).toContainText('button x2');
});
