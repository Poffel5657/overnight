// Tag 5: die Kanäle unter dem Brunnen, Rüstung und Truhen, die erste Quest und der erste Boss.
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import {
  act, activeEvent, attackOf, countItem, createGame, damageFrom, defenseOf, entityAt, equip, questState, tileAt,
  AI_BEHAVIOURS,
} from '../../src/game.js';
import { CREATURES } from '../../content/creatures.js';
import { MAPS } from '../../content/world.js';
import { QUESTS } from '../../content/quests.js';
import { ITEMS } from '../../content/items.js';

const quiet = (map, x, y, seed = 1) => {
  const s = createGame({ seed });
  const event = activeEvent();
  if (event) s.flags.eventsHeard = { [event.id]: true };
  s.map = map;
  s.creatures = [];
  s.player.x = x;
  s.player.y = y;
  return s;
};

const foe = (type, x, y) => ({
  type, x, y, hp: CREATURES[type].hp, spawn: { x, y }, respawnAt: null, once: false,
});

// Alle Felder, die man von (x, y) aus erreicht. Türen, Gitter und Truhen zählen als erreichbar, aber nicht als Weg.
function reachable(map, x, y, openGates = false) {
  const seen = new Set([`${x},${y}`]);
  const queue = [[x, y]];
  const blocking = (ex, ey) => MAPS[map].entities.find((e) => e.x === ex && e.y === ey && (e.kind !== 'gate' || !openGates));
  while (queue.length) {
    const [cx, cy] = queue.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx;
      const ny = cy + dy;
      const key = `${nx},${ny}`;
      if (seen.has(key) || !tileAt(map, nx, ny).walkable) continue;
      seen.add(key);
      if (!blocking(nx, ny)) queue.push([nx, ny]);
    }
  }
  return seen;
}

test('Wer heil ist und am Brunnen trinkt, rutscht in die Kanäle', () => {
  const s = quiet('meadow', 13, 2);
  act(s, 'right');
  expect(s.map).toBe('drains');
  expect([s.player.x, s.player.y]).toEqual([2, 2]);
  expect(s.log.some((l) => l.text.includes('drains'))).toBe(true);
});

test('Wer verletzt ist, wird am Brunnen weiter nur geheilt', () => {
  const s = quiet('meadow', 13, 2);
  s.player.hp = 3;
  act(s, 'right');
  expect(s.map).toBe('meadow');
  expect(s.player.hp).toBe(s.player.maxHp);
});

test('Die Leiter führt zurück zum Brunnen, das Gitter in den Rough Draft und zurück', () => {
  const s = quiet('drains', 2, 2);
  act(s, 'up');
  expect(s.map).toBe('meadow');
  expect([s.player.x, s.player.y]).toEqual([14, 3]);
  const t = quiet('drains', 27, 2);
  act(t, 'up');
  expect(t.map).toBe('draft');
  t.creatures = [];
  t.player.x = 4;
  t.player.y = 8;
  act(t, 'left');
  expect(t.map).toBe('drains');
  expect([t.player.x, t.player.y]).toEqual([27, 2]);
});

test('In den Kanälen ist alles erreichbar, der Sumpf nur durch das Gitter', () => {
  const closed = reachable('drains', 2, 2);
  for (const id of ['drain-ladder', 'drain-grate', 'drain-chest', 'footprints', 'drains-crumb', 'sump-gate']) {
    const e = MAPS.drains.entities.find((x) => x.id === id);
    expect(closed.has(`${e.x},${e.y}`), id).toBe(true);
  }
  const chest = MAPS.drains.entities.find((x) => x.id === 'sump-chest');
  expect(closed.has(`${chest.x},${chest.y}`)).toBe(false);
  expect(closed.has('26,9')).toBe(false);
  const open = reachable('drains', 2, 2, true);
  expect(open.has(`${chest.x},${chest.y}`)).toBe(true);
  expect(open.has('26,9')).toBe(true);
  expect(tileAt('drains', 3, 6).walkable).toBe(false);
  expect(tileAt('drains', 8, 6).name).toBe('plank');
});

test('Die Truhe gibt einmal einen Durchschlag, der angelegt wird und schützt', () => {
  const s = quiet('drains', 2, 9);
  act(s, 'down');
  expect(s.player.armor.head).toBe('colander');
  expect(defenseOf(s)).toBe(1);
  expect(s.flags.opened['drain-chest']).toBe(true);
  expect(entityAt(s, 2, 10)?.id).toBe('drain-chest');
  act(s, 'down');
  expect(s.log.at(-1).text).toContain('empty');
  expect(countItem(s, 'colander')).toBe(1);
  // Abwehr 1 zieht einen Punkt ab, aber nie mehr als die Hälfte eines Schlags (Rebalance nach Tag 7).
  expect(damageFrom(s, CREATURES.frog)).toBe(Math.max(Math.ceil(CREATURES.frog.atk / 2), CREATURES.frog.atk - 1));
  expect(damageFrom(s, CREATURES.rat)).toBe(1);
  expect(damageFrom(s, CREATURES['crumb-heap'])).toBe(CREATURES['crumb-heap'].atk - 1);
});

test('Drei Knöpfe werden an der Werkbank zu Knopfpanzer, zwei reichen nicht', () => {
  const s = quiet('meadow', 9, 6);
  s.player.bag = ['button', 'button'];
  act(s, 'right');
  expect(s.player.armor.body).toBe(null);
  expect(s.log.at(-1).text).toContain('three');
  s.player.bag.push('button', 'pencil-stub');
  act(s, 'right');
  expect(s.player.armor.body).toBe('button-mail');
  expect(s.player.bag).toEqual(['pencil-stub']);
});

test('Waffen und Rüstung aus dem Beutel lassen sich anlegen, ohne eine Runde', () => {
  const s = quiet('meadow', 5, 5);
  s.player.weapon = 'stone-spear';
  s.player.bag = ['stick', 'colander', 'button'];
  expect(equip(s, 'stick')).toBe(true);
  expect(s.player.weapon).toBe('stick');
  expect(s.player.bag).toContain('stone-spear');
  expect(equip(s, 'colander')).toBe(true);
  expect(s.player.armor.head).toBe('colander');
  expect(equip(s, 'button')).toBe(false);
  expect(equip(s, 'drain-hook')).toBe(false);
  expect(s.turn).toBe(0);
});

test('Die Quest des Keepers: Krümel zeigen, drei bringen, Schlüssel bekommen', () => {
  const quest = QUESTS.find((q) => q.id === 'grey-crumbs');
  const s = quiet('meadow', 11, 5);
  act(s, 'right');
  expect(questState(s, quest.id)).toBe(null);
  s.player.bag = ['crumb'];
  act(s, 'right');
  expect(questState(s, quest.id)).toBe('active');
  expect(s.log.at(-1).text).toContain(quest.offerText);
  act(s, 'right');
  expect(s.log.at(-1).text).toContain('(1/3)');
  act(s, 'right');
  expect(s.log.at(-1).text).not.toContain('(1/3)');
  s.player.bag.push('crumb', 'crumb', 'button');
  const xp = s.player.xp;
  act(s, 'right');
  expect(questState(s, quest.id)).toBe('done');
  expect(s.player.bag).toEqual(['button', 'keeper-key']);
  expect(s.player.xp).toBe(xp + quest.reward.xp);
  act(s, 'right');
  expect(s.log.at(-1).text).not.toContain(quest.doneText);
});

test('Es gibt genug Krümel für die Quest, auch ohne Glück', () => {
  const crumbs = Object.values(MAPS).flatMap((m) => m.entities).filter((e) => e.item === 'crumb');
  expect(crumbs.length).toBeGreaterThanOrEqual(2);
  expect(CREATURES.frog.drops.some((d) => d.item === 'crumb')).toBe(true);
});

test('Das Gitter öffnet sich nur mit dem Schlüssel des Keepers und bleibt offen', () => {
  const s = quiet('drains', 24, 5);
  act(s, 'down');
  act(s, 'down');
  expect(s.player.y).toBe(6);
  expect(entityAt(s, 24, 7)?.kind).toBe('gate');
  s.player.bag = ['keeper-key'];
  act(s, 'down');
  expect(entityAt(s, 24, 7)).toBeUndefined();
  expect(s.player.bag).toEqual([]);
  act(s, 'down');
  expect([s.player.x, s.player.y]).toEqual([24, 7]);
});

test('Aale rühren sich nicht, beißen aber daneben', () => {
  const s = quiet('drains', 10, 3);
  const eel = foe('eel', 12, 5);
  s.creatures = [eel];
  for (let i = 0; i < 6; i += 1) act(s, 'wait');
  expect([eel.x, eel.y]).toEqual([12, 5]);
  s.player.x = 12;
  s.player.y = 4;
  let bitten = false;
  for (let i = 0; i < 10 && !bitten; i += 1) bitten = AI_BEHAVIOURS.lurk(s, eel, CREATURES.eel) || s.player.hp < s.player.maxHp;
  expect(bitten).toBe(true);
});

test('Der Krümelhaufen ist langsam, zäh und kommt nach dem Sieg nie wieder', () => {
  const s = quiet('drains', 25, 11);
  const heap = foe('crumb-heap', 25, 8);
  s.creatures = [heap];
  s.turn = 1;
  AI_BEHAVIOURS.trudge(s, heap, CREATURES['crumb-heap']);
  expect(heap.y).toBe(8);
  s.turn = 2;
  AI_BEHAVIOURS.trudge(s, heap, CREATURES['crumb-heap']);
  expect(heap.y).toBe(9);

  s.player.weapon = 'stone-spear';
  s.player.atk = 3;
  s.player.y = 10;
  s.player.hp = 999;
  s.player.maxHp = 999;
  let hits = 0;
  while (s.creatures.includes(heap) && hits < 20) {
    act(s, 'up');
    hits += 1;
  }
  expect(hits).toBe(Math.ceil(CREATURES['crumb-heap'].hp / 6));
  expect(s.flags.slain['crumb-heap']).toBe(true);
  expect(s.player.weapon).toBe('drain-hook');
  expect(s.player.bag).toContain('stone-spear');
  expect(attackOf(s)).toBe(s.player.atk + ITEMS['drain-hook'].atk);
  const again = createGame({ seed: 2, saved: { map: 'drains', player: { x: 2, y: 2 }, flags: { slain: { 'crumb-heap': true } } } });
  expect(again.creatures.some((c) => c.type === 'crumb-heap')).toBe(false);
  const fresh = createGame({ seed: 2, saved: { map: 'drains', player: { x: 2, y: 2 } } });
  expect(fresh.creatures.some((c) => c.type === 'crumb-heap')).toBe(true);
});

test('Spielstände ohne Rüstung laden, falsche Rüstung wird verworfen', () => {
  const old = JSON.parse(readFileSync('tests/fixtures/save-v1-day4-level.json', 'utf8'));
  const s = createGame({ seed: 1, saved: old });
  expect(s.player.armor).toEqual({ head: null, body: null, feet: null });
  expect(defenseOf(s)).toBe(0);
  const day5 = JSON.parse(readFileSync('tests/fixtures/save-v1-day5-gear.json', 'utf8'));
  const t = createGame({ seed: 1, saved: day5 });
  expect(t.map).toBe('drains');
  expect(t.player.armor.head).toBe('colander');
  expect(defenseOf(t)).toBe(2);
  expect(questState(t, 'grey-crumbs')).toBe('active');
  const odd = createGame({ seed: 1, saved: { map: 'meadow', player: { x: 8, y: 5, armor: { head: 'button-mail', feet: 'nope' } } } });
  expect(odd.player.armor).toEqual({ head: null, body: null, feet: null });
});

test('Das Fenster GEAR zeigt Werte und legt Dinge aus dem Beutel an', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('overnight.save', JSON.stringify({
      version: 1, map: 'meadow', turn: 3, lastSeenDay: 5, flags: {}, stats: {},
      player: { x: 8, y: 5, hp: 10, maxHp: 10, atk: 1, weapon: 'stick', bag: ['colander', 'stone-spear', 'crumb'] },
    }));
  });
  await page.goto('/?seed=3');
  await page.waitForFunction(() => window.__overnight);
  await page.locator('#open-chara').click();
  await expect(page.locator('#chara-dialog')).toBeVisible();
  await expect(page.locator('#chara-stats')).toContainText('ATK2');
  await expect(page.locator('#chara-stats')).toContainText('DEF0');
  // Reiter wechselt in den Beutel, der vergleicht mit dem Getragenen.
  await page.locator('#chara-dialog [data-switch="bag-dialog"]').click();
  await expect(page.locator('#bag-dialog')).toBeVisible();
  await expect(page.locator('#chara-dialog')).toBeHidden();
  await expect(page.locator('#bag-gear [data-item="stone-spear"] .gear-compare')).toHaveText('▲ 2 ATK');
  await page.locator('#bag-gear [data-item="colander"]').getByRole('button', { name: 'Wear' }).click();
  await expect(page.locator('#bag-status')).toContainText('colander');
  await page.locator('#bag-gear [data-item="stone-spear"]').getByRole('button', { name: 'Wield' }).click();
  // Der alte Stock liegt jetzt im Beutel und ist schwächer.
  await expect(page.locator('#bag-gear [data-item="stick"] .gear-compare')).toHaveText('▼ 2 ATK');
  await expect(page.locator('#bag-other [data-item="crumb"]').getByRole('button')).toHaveCount(0);
  await page.keyboard.press('c');
  await expect(page.locator('#chara-dialog')).toBeVisible();
  await expect(page.locator('#chara-stats')).toContainText('ATK4');
  await expect(page.locator('#chara-stats')).toContainText('DEF1');
  await expect(page.locator('#chara-worn')).toContainText('colander');
  // Dieselbe Taste schließt wieder; die Leiste unter der Karte zählt nur noch den Beutel.
  await page.keyboard.press('c');
  await expect(page.locator('#chara-dialog')).toBeHidden();
  await expect(page.locator('#bag-count')).toHaveText(' 2');
  await page.keyboard.press('i');
  await expect(page.locator('#bag-dialog')).toBeVisible();
  await page.locator('#bag-dialog [data-close]').click();
  await expect(page.locator('#bag-dialog')).toBeHidden();
});

test('Eine angenommene Quest steht im Quest-Log mit Fortschritt', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('overnight.save', JSON.stringify({
      version: 1, map: 'meadow', turn: 3, lastSeenDay: 5, stats: {},
      flags: { quests: { 'grey-crumbs': 'active' } },
      player: { x: 8, y: 5, hp: 10, maxHp: 10, atk: 1, bag: ['crumb', 'crumb'] },
    }));
  });
  await page.goto('/?seed=3');
  await page.waitForFunction(() => window.__overnight);
  const entry = page.locator('.quest-entry[data-quest="grey-crumbs"]');
  await expect(entry).toHaveCount(1);
  await expect(entry).toContainText('crumbs 2/3');
  await expect(page.locator('#quest-log')).toBeVisible();
});
