// Tag 0: Kernregeln der Welt.
import { expect, test } from '@playwright/test';
import { act, createGame } from '../../src/game.js';

const quietGame = (x, y) => {
  const s = createGame({ seed: 1 });
  s.creatures = [];
  s.player.x = x;
  s.player.y = y;
  return s;
};

test('Der Keeper sagt der Reihe nach etwas', () => {
  const s = quietGame(11, 5);
  act(s, 'right');
  act(s, 'right');
  expect(s.log[0].text).toContain('awake');
  expect(s.log[1].text).toContain('midnight');
  expect(s.player.x).toBe(11);
});

test('Der Brunnen heilt', () => {
  const s = quietGame(13, 2);
  s.player.hp = 1;
  act(s, 'right');
  expect(s.player.hp).toBe(s.player.maxHp);
});

test('Der Rand der Welt ist höflich und kostet keine Runde', () => {
  const s = quietGame(23, 8);
  expect(act(s, 'right')).toBe(false);
  expect(s.log.at(-1).text).toContain("isn't finished");
  expect(s.turn).toBe(0);
});

test('Eine Ratte braucht zwei Schläge und zählt dann als besiegt', () => {
  const s = createGame({ seed: 1 });
  const [rat] = s.creatures;
  s.creatures = [rat];
  s.player.x = rat.x - 1;
  s.player.y = rat.y;
  act(s, 'right');
  expect(s.stats.kills).toBe(0);
  rat.x = s.player.x + 1;
  rat.y = s.player.y;
  act(s, 'right');
  expect(s.stats.kills).toBe(1);
  expect(rat.respawnAt).not.toBeNull();
});

test('Niederlage bringt den Spieler zurück ins Bett', () => {
  const s = quietGame(10, 10);
  const rat = createGame({ seed: 2 }).creatures[0];
  rat.x = 11;
  rat.y = 10;
  s.creatures = [rat];
  s.player.y = 10;
  s.player.hp = 1;
  for (let i = 0; i < 40 && s.stats.faints === 0; i += 1) {
    rat.x = s.player.x + 1;
    rat.y = s.player.y;
    act(s, 'wait');
  }
  expect(s.stats.faints).toBe(1);
  expect(s.player.hp).toBe(s.player.maxHp);
  expect([s.player.x, s.player.y]).toEqual([8, 5]);
});
