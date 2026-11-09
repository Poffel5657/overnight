// Tag 6: Mainspring (Gewinner von Zettel 5), der Stand des Dealers, tägliche Gefallen, Knacks,
// die Echos als Geschichte (Quest "Many Hands"), die Overwound Clock und die Tinte um die ausradierte Ecke.
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import {
  act, activeEvent, attackOf, buy, countItem, createGame, currentDay, defenseOf, entityAt, learnSkill, questProgress,
  questState, rewardKill, skillPoints, tileAt, useItem,
} from '../../src/game.js';
import { MAPS } from '../../content/world.js';
import { QUESTS } from '../../content/quests.js';
import { SHOPS } from '../../content/shops.js';
import { ITEMS } from '../../content/items.js';
import { CREATURES } from '../../content/creatures.js';
import { EVENT } from '../../content/event.js';

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
const quest = (id) => QUESTS.find((q) => q.id === id);
const talk = (s, dir) => act(s, dir);

// Alle Felder, die man von (x, y) aus erreicht.
function reachable(map, x, y) {
  const seen = new Set([`${x},${y}`]);
  const queue = [[x, y]];
  const blocking = (ex, ey) => MAPS[map].entities.find((e) => e.x === ex && e.y === ey);
  while (queue.length) {
    const [cx, cy] = queue.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const key = `${cx + dx},${cy + dy}`;
      if (seen.has(key) || !tileAt(map, cx + dx, cy + dy).walkable) continue;
      seen.add(key);
      if (!blocking(cx + dx, cy + dy)) queue.push([cx + dx, cy + dy]);
    }
  }
  return seen;
}

test('Das Messingtor im Westen der Wiese führt nach Mainspring und zurück', () => {
  const s = quiet('meadow', 3, 7);
  expect(entityAt(s, 2, 7)?.id).toBe('west-gate');
  act(s, 'left');
  expect(s.map).toBe('town');
  expect([s.player.x, s.player.y]).toEqual([2, 6]);
  act(s, 'left');
  expect(s.map).toBe('meadow');
  expect([s.player.x, s.player.y]).toEqual([3, 7]);
});

test('In Mainspring ist alles erreichbar: Figuren, Schilder, Mäuse und die Uhr', () => {
  const seen = reachable('town', 2, 6);
  for (const e of MAPS.town.entities) expect(seen.has(`${e.x},${e.y}`), e.id).toBe(true);
  for (const sp of MAPS.town.spawns) expect(seen.has(`${sp.x},${sp.y}`), sp.type).toBe(true);
  // Die Wiese erreicht das Tor vom Start aus.
  expect(reachable('meadow', 8, 5).has('2,7')).toBe(true);
});

test('Tinker: drei Federn gegen den Schraubenschlüssel', () => {
  const s = quiet('town', 3, 3);
  talk(s, 'up');
  expect(questState(s, 'loose-springs')).toBe('active');
  s.player.bag.push('spring', 'spring');
  expect(questProgress(s, quest('loose-springs'))).toBe(2);
  s.player.bag.push('spring');
  talk(s, 'up');
  expect(questState(s, 'loose-springs')).toBe('done');
  expect(s.player.weapon).toBe('wrench');
  expect(countItem(s, 'spring')).toBe(0);
});

test('Mayor: täglicher Gefallen, jede Nacht neu', () => {
  const s = quiet('town', 14, 5);
  talk(s, 'up');
  expect(questState(s, 'winding-duty')).toBe('active');
  s.player.bag.push('spring', 'spring');
  talk(s, 'up');
  expect(questState(s, 'winding-duty')).toBe('done');
  expect(countItem(s, 'button')).toBe(2);
  // Dieselbe Nacht: kein neuer Gefallen, die Figur plaudert.
  talk(s, 'up');
  expect(questState(s, 'winding-duty')).toBe('done');
  // Nächste Nacht (gespeicherter Tag ist alt): wieder zu haben.
  s.flags.questDay['winding-duty'] = currentDay() - 1;
  talk(s, 'up');
  expect(questState(s, 'winding-duty')).toBe('active');
  expect(s.log.at(-1).text).toContain('Two springs');
});

test('Dealer: Gelegenheitsjob erst nach "Grey Crumbs"', () => {
  const s = quiet('draft', 16, 8);
  talk(s, 'up');
  expect(questState(s, 'odd-jobs')).toBe(null);
  s.flags.quests = { 'grey-crumbs': 'done' };
  talk(s, 'up');
  expect(questState(s, 'odd-jobs')).toBe('active');
  s.player.bag.push('crumb', 'crumb');
  talk(s, 'up');
  expect(questState(s, 'odd-jobs')).toBe('done');
  expect(countItem(s, 'button')).toBe(3);
});

test('Stand des Dealers: Fenster öffnen, kaufen, nicht ohne Knöpfe', () => {
  const s = quiet('draft', 14, 7);
  act(s, 'right');
  expect(s.openShop).toBe('dealer');
  expect(buy(s, 'dealer', 'tonic')).toBe(false);
  s.player.bag.push('button', 'button', 'button');
  expect(buy(s, 'dealer', 'tonic')).toBe(true);
  expect(countItem(s, 'button')).toBe(1);
  expect(countItem(s, 'tonic')).toBe(1);
  expect(buy(s, 'dealer', 'no-such-thing')).toBe(false);
  for (const offer of SHOPS.dealer.stock) expect(ITEMS[offer.item], offer.item).toBeTruthy();
});

test('Tonikum heilt, aber nicht über das Maximum und nicht bei vollen HP', () => {
  const s = quiet('meadow', 8, 5);
  s.player.bag.push('tonic');
  expect(useItem(s, 'tonic')).toBe(false);
  s.player.hp = 3;
  expect(useItem(s, 'tonic')).toBe(true);
  expect(s.player.hp).toBe(Math.min(s.player.maxHp, 3 + ITEMS.tonic.heal));
  expect(countItem(s, 'tonic')).toBe(0);
});

test('Knacks: ein Punkt pro Aufstieg, Ränge geben Werte, höchstens drei', () => {
  const s = quiet('meadow', 8, 5);
  expect(skillPoints(s)).toBe(0);
  expect(learnSkill(s, 'sharp')).toBe(false);
  s.player.level = 5;
  expect(skillPoints(s)).toBe(4);
  const atk = attackOf(s);
  const def = defenseOf(s);
  const maxHp = s.player.maxHp;
  expect(learnSkill(s, 'sharp')).toBe(true);
  expect(learnSkill(s, 'thick')).toBe(true);
  expect(learnSkill(s, 'sturdy')).toBe(true);
  expect(attackOf(s)).toBe(atk + 1);
  expect(defenseOf(s)).toBe(def + 1);
  expect(s.player.maxHp).toBe(maxHp + 3);
  learnSkill(s, 'sharp');
  expect(skillPoints(s)).toBe(0);
  expect(learnSkill(s, 'sharp')).toBe(false);
  s.player.level = 10;
  learnSkill(s, 'sharp');
  expect(learnSkill(s, 'sharp')).toBe(false);
  expect(s.player.skills.sharp).toBe(3);
});

test('Alte Spielstände bekommen ihre Knack-Punkte, kaputte Knacks werden verworfen', () => {
  const saved = JSON.parse(readFileSync('tests/fixtures/save-v1-day5-gear.json', 'utf8'));
  const s = createGame({ saved, seed: 1 });
  expect(s.player.skills).toEqual({});
  expect(skillPoints(s)).toBe(s.player.level - 1);
  expect(s.stats.together).toBe(0);
  const broken = createGame({ saved: { ...saved, player: { ...saved.player, level: 2, skills: { sharp: 3, nonsense: 2 } } }, seed: 1 });
  expect(skillPoints(broken)).toBeGreaterThanOrEqual(0);
  const fresh = createGame({ saved: JSON.parse(readFileSync('tests/fixtures/save-v1-day6-knacks.json', 'utf8')), seed: 1 });
  expect(fresh.player.skills).toEqual({ sharp: 1, sturdy: 1 });
  expect(fresh.flags.questDay['winding-duty']).toBe(6);
});

test('Keeper: "Many Hands" zählt nur gemeinsame Siege seit dem Annehmen', () => {
  const s = quiet('meadow', 11, 5);
  s.flags.quests = { 'grey-crumbs': 'done' };
  s.stats.together = 4;
  talk(s, 'right');
  expect(questState(s, 'many-hands')).toBe('active');
  expect(questProgress(s, quest('many-hands'))).toBe(0);
  s.stats.together = 7;
  expect(questProgress(s, quest('many-hands'))).toBe(3);
  talk(s, 'right');
  expect(questState(s, 'many-hands')).toBe('done');
  expect(countItem(s, 'strong-tea')).toBe(2);
});

test('Overwound Clock: Boss mit eigener Abschiedszeile und Messinghelm', () => {
  const def = CREATURES['overwound-clock'];
  expect(def.boss).toBe(true);
  expect(def.hp).toBeGreaterThan(CREATURES['crumb-heap'].hp);
  const s = quiet('town', 26, 10);
  rewardKill(s, 'overwound-clock', 'You defeat it.');
  expect(s.flags.slain['overwound-clock']).toBe(true);
  expect(s.log.some((l) => l.text.includes('strikes thirteen'))).toBe(true);
  expect(s.player.armor.head).toBe('brass-helm');
  expect(countItem(s, 'spring')).toBe(1);
});

test('Die Wache hat gehalten: Tinte um die Ecke, die Vogelscheuche schenkt einmal ihren Hut', () => {
  expect(EVENT).toBe(null);
  expect(tileAt('draft', 12, 8).name).toBe('ink line');
  expect(tileAt('draft', 12, 8).walkable).toBe(false);
  const s = quiet('draft', 12, 6);
  const xp = s.player.xp;
  talk(s, 'up');
  expect(s.player.armor.head).toBe('straw-hat');
  expect(s.player.xp).toBe(xp + 5);
  talk(s, 'up');
  expect(countItem(s, 'straw-hat')).toBe(1);
});

test('Im Browser: Laden, Knacks und gemeinsame Siege', async ({ page }) => {
  await page.goto('/?seed=3');
  await page.waitForFunction(() => window.__overnight);
  // Vor den Stand stellen und hineinlaufen: Das Fenster [ SHOP ] geht auf.
  await page.evaluate(() => {
    const s = window.__overnight.state;
    s.map = 'draft';
    s.creatures = [];
    s.player.x = 14;
    s.player.y = 7;
    s.player.bag.push('button', 'button');
    s.player.level = 2;
  });
  await page.evaluate(() => window.__overnight.act('right'));
  await expect(page.locator('#shop-dialog')).toBeVisible();
  await expect(page.locator('#shop-purse')).toContainText('2 buttons');
  await page.locator('#shop-stock [data-item="tonic"] button').click();
  await expect(page.locator('#shop-purse')).toContainText('0 buttons');
  expect(await page.evaluate(() => window.__overnight.state.player.bag.includes('tonic'))).toBe(true);
  await page.keyboard.press('Escape');

  // Fenster [ BAG ]: Tonikum benutzen. Fenster [ CHARA ]: einen Knack lernen.
  await page.evaluate(() => { window.__overnight.state.player.hp = 2; });
  await expect(page.locator('#chara-badge')).toHaveText(' +1');
  await page.keyboard.press('b');
  await page.locator('#bag-use [data-item="tonic"]').getByRole('button', { name: 'Use' }).click();
  expect(await page.evaluate(() => window.__overnight.state.player.hp)).toBeGreaterThan(2);
  await page.keyboard.press('c');
  await expect(page.locator('#chara-points')).toContainText('1 point to spend');
  await page.locator('#chara-knacks [data-skill="sharp"] button').click();
  expect(await page.evaluate(() => window.__overnight.state.player.skills.sharp)).toBe(1);
  await expect(page.locator('#chara-knacks [data-skill="sharp"] button')).toHaveCount(0);
  await expect(page.locator('#chara-status')).toContainText('Sharp 1/3');
  await expect(page.locator('#chara-badge')).toBeHidden();
});

test('BAG: Getränke bei vollen HP gesperrt, CHARA zeigt Fortschritt zur nächsten Stufe', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('overnight.save', JSON.stringify({
      version: 1, map: 'meadow', turn: 3, lastSeenDay: 6, flags: {}, stats: {},
      player: { x: 8, y: 5, hp: 10, maxHp: 10, atk: 1, weapon: 'stick', bag: ['tonic', 'tonic', 'button'], xp: 8, level: 2 },
    }));
  });
  await page.goto('/?seed=3');
  await page.waitForFunction(() => window.__overnight);
  await expect(page.locator('#xp-meter')).toContainText('LV 2');
  await expect(page.locator('#xp-meter')).toContainText('8/12 XP');
  await page.locator('#open-bag').click();
  const tonic = page.locator('#bag-use [data-item="tonic"]');
  await expect(tonic.locator('.gear-kind')).toHaveText('x2');
  await expect(tonic.getByRole('button', { name: 'Use' })).toBeDisabled();
  await expect(page.locator('#bag-section-gear')).toBeHidden();
  await page.keyboard.press('Escape');
  await page.keyboard.press('c');
  await expect(page.locator('#chara-stats')).toContainText('4 XP to level 3');
});

test('Gemeinsame Welt: Ein Sieg zusammen mit einem Echo zählt für "Many Hands", allein nicht', async ({ page }) => {
  await page.addInitScript(() => {
    window.__presence = [];
    window.WebSocket = class {
      constructor(url) {
        this.url = String(url);
        this.sent = [];
        this.listeners = {};
        if (!this.url.includes('/presence')) return;
        window.__presence.push(this);
        setTimeout(() => this.emit('message', { data: JSON.stringify({ t: 'hello', id: 'ff00', name: 'scribe-abc', peers: [] }) }), 0);
      }
      addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
      emit(type, event) { (this.listeners[type] || []).forEach((fn) => fn(event)); }
      send(raw) { this.sent.push(JSON.parse(raw)); }
      close() { this.closed = true; }
    };
  });
  await page.goto('/?seed=7&echoes=1');
  await page.waitForFunction(() => window.__overnight && window.__presence.length === 1 && window.__presence[0].sent.length > 0);
  const slain = (by) => page.evaluate((list) => window.__presence[0].emit('message', { data: JSON.stringify({
    t: 'slain', id: 'c1', type: 'mouse', by: list,
  }) }), by);
  await slain([{ id: 'ff00', name: 'scribe-abc' }]);
  expect(await page.evaluate(() => window.__overnight.state.stats.together)).toBe(0);
  await slain([{ id: 'ff00', name: 'scribe-abc' }, { id: 'aa11', name: 'tinker-3f2' }]);
  expect(await page.evaluate(() => window.__overnight.state.stats.together)).toBe(1);
  await expect(page.locator('#log')).toContainText('Together with tinker-3f2 you defeat the clockwork mouse.');
});
