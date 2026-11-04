// Tag 1: Ein Stock liegt auf der Wiese und macht Ratten zu Ein-Schlag-Gegnern.
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { act, attackOf, createGame, entityAt } from '../../src/game.js';

const quietGame = (x, y, saved = null) => {
  const s = createGame({ seed: 1, saved });
  s.creatures = [];
  s.player.x = x;
  s.player.y = y;
  return s;
};

test('Den Stock aufheben erhöht den Angriff und er verschwindet von der Karte', () => {
  const s = quietGame(19, 8);
  expect(attackOf(s)).toBe(1);
  expect(act(s, 'right')).toBe(true);
  expect(s.player.weapon).toBe('stick');
  expect(attackOf(s)).toBe(2);
  expect(entityAt(s, 20, 8)).toBeUndefined();
  act(s, 'right');
  expect(s.player.x).toBe(20);
});

test('Mit dem Stock fällt eine Ratte nach einem Schlag', () => {
  const s = createGame({ seed: 1 });
  const [rat] = s.creatures;
  s.creatures = [rat];
  s.player.weapon = 'stick';
  s.player.x = rat.x - 1;
  s.player.y = rat.y;
  act(s, 'right');
  expect(s.stats.kills).toBe(1);
  expect(s.log.some((l) => l.text.includes('whack'))).toBe(true);
});

test('Der Keeper bemerkt den Stock genau einmal', () => {
  const s = quietGame(11, 5);
  s.player.weapon = 'stick';
  act(s, 'right');
  act(s, 'right');
  expect(s.log[0].text).toContain('stick');
  expect(s.log[1].text).toContain('awake');
});

test('Der Stock bleibt nach einer Niederlage und nach dem Laden erhalten', () => {
  const saved = JSON.parse(readFileSync('tests/fixtures/save-v1-day1-stick.json', 'utf8'));
  const s = createGame({ seed: 1, saved });
  expect(s.player.weapon).toBe('stick');
  expect(entityAt(s, 20, 8)).toBeUndefined();
});

test('Alter Spielstand von Tag 0 hat keinen Stock, aber er liegt bereit', () => {
  const saved = JSON.parse(readFileSync('tests/fixtures/save-v1-day0.json', 'utf8'));
  const s = createGame({ seed: 1, saved });
  expect(s.player.weapon).toBeNull();
  expect(attackOf(s)).toBe(1);
  expect(entityAt(s, 20, 8)?.item).toBe('stick');
});
