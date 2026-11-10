// Tag 8: der erste Beruf (Bergbau, Gewinner von Zettel 7), das Fenster WORKBENCH,
// und der ausradierte Südrand der Wiese mit der Vermesserin und den Radiermilben.
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import {
  act, canCraft, countItem, craft, createGame, defenseOf, entityAt, equip, miningRank, questState, tileAt, veinLeft,
  attackOf,
} from '../../src/game.js';
import { MAPS } from '../../content/world.js';
import { ITEMS } from '../../content/items.js';
import { RECIPES } from '../../content/recipes.js';
import { QUESTS } from '../../content/quests.js';
import { MINING } from '../../content/trades.js';
import { CREATURES } from '../../content/creatures.js';
import { playerFor } from '../balance/probe.js';

const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const entity = (map, id) => MAPS[map].entities.find((e) => e.id === id);
// Die Antwort der Welt auf den letzten Zug, auch wenn danach noch etwas zugebissen hat.
const said = (s, text) => s.log.slice(-4).some((l) => l.text.includes(text));

// Wie ein Spieler laufen: kürzester Weg über begehbare Felder, nur mit act(). Kreaturen im Weg werden gehauen.
function walkTo(s, x, y, limit = 400) {
  for (let i = 0; i < limit; i += 1) {
    if (s.player.x === x && s.player.y === y) return true;
    const seen = new Set([`${s.player.x},${s.player.y}`]);
    const queue = [{ x: s.player.x, y: s.player.y, first: null }];
    let step = null;
    while (queue.length && !step) {
      const cur = queue.shift();
      for (const [name, [dx, dy]] of Object.entries(DIRS)) {
        const nx = cur.x + dx;
        const ny = cur.y + dy;
        const key = `${nx},${ny}`;
        if (seen.has(key) || !tileAt(s.map, nx, ny).walkable || entityAt(s, nx, ny)) continue;
        seen.add(key);
        const first = cur.first ?? name;
        if (nx === x && ny === y) { step = first; break; }
        queue.push({ x: nx, y: ny, first });
      }
    }
    if (!step) return false;
    act(s, step);
  }
  return false;
}

// In ein Objekt hineinlaufen: erst daneben stellen, dann hinein.
function bump(s, e) {
  for (const [name, [dx, dy]] of Object.entries(DIRS)) {
    const x = e.x - dx;
    const y = e.y - dy;
    if (!tileAt(s.map, x, y).walkable || entityAt(s, x, y)) continue;
    if (!walkTo(s, x, y)) continue;
    return act(s, name);
  }
  throw new Error(`Komme nicht an ${e.id}`);
}

const toTown = (s) => { if (s.map !== 'town') bump(s, entity('meadow', 'west-gate')); expect(s.map).toBe('town'); };
const toMeadow = (s) => { if (s.map !== 'meadow') bump(s, entity('town', 'town-gate')); expect(s.map).toBe('meadow'); };

// Eine Nacht Bergbau in der Stadt (ohne die Ader im Winding Yard, dort steht die Overwound Clock).
function digTonight(s) {
  for (const id of ['vein-pit', 'vein-south', 'vein-square']) {
    const vein = entity('town', id);
    while (veinLeft(s, vein) > 0) bump(s, vein);
  }
}

test('Spielweg Bergbau: Hacke finden, Erz schlagen, an der Werkbank Messingplatte machen und anziehen', () => {
  const s = playerFor('mainspring');
  toTown(s);
  // Ohne Hacke gibt die Ader nichts her.
  bump(s, entity('town', 'vein-pit'));
  expect(said(s, MINING.noToolText)).toBe(true);
  expect(countItem(s, 'brass-ore')).toBe(0);
  // Die alte Hacke liegt neben dem Schild an der Grube.
  bump(s, entity('town', 'old-pick'));
  expect(countItem(s, 'pick')).toBe(1);
  digTonight(s);
  const ore = countItem(s, 'brass-ore');
  expect(ore).toBeGreaterThanOrEqual(6);
  expect(s.player.mining).toBe(6);
  expect(miningRank(s)).toBe(1);
  expect(s.log.some((l) => l.text.includes('Mining: Digger'))).toBe(true);
  expect(s.stats.ore).toBe(ore);
  // Ausgeschöpft für heute.
  bump(s, entity('town', 'vein-pit'));
  expect(said(s, 'worked out for tonight')).toBe(true);
  // An der Werkbank des Tinkers: Das Fenster zeigt, was geht.
  bump(s, entity('town', 'tinker-bench'));
  expect(s.openBench).toBe('tinker-bench');
  expect(said(s, 'brass plate')).toBe(true);
  const before = defenseOf(s);
  expect(craft(s, 'brass-plate')).toBe(true);
  expect(countItem(s, 'brass-ore')).toBe(ore - 5);
  // Der Knopfpanzer sitzt schon, die Platte kommt in den Beutel und wird im Fenster BAG angezogen.
  expect(equip(s, 'brass-plate')).toBe(true);
  expect(s.player.armor.body).toBe('brass-plate');
  expect(defenseOf(s)).toBe(before - ITEMS['button-mail'].def + ITEMS['brass-plate'].def);
});

test('Spielweg Vermesserin: Quest annehmen, Pflöcke schmieden, Stiefel bekommen, danach Milben zählen', () => {
  const s = playerFor('mainspring');
  const surveyor = entity('meadow', 'surveyor');
  bump(s, surveyor);
  expect(questState(s, 'pegging-the-edge')).toBe('active');
  expect(said(s, 'pegged')).toBe(true);
  toTown(s);
  bump(s, entity('town', 'old-pick'));
  digTonight(s);
  bump(s, entity('town', 'tinker-bench'));
  for (let i = 0; i < 3; i += 1) expect(craft(s, 'brass-peg')).toBe(true);
  expect(countItem(s, 'brass-peg')).toBe(3);
  toMeadow(s);
  const before = defenseOf(s);
  bump(s, surveyor);
  expect(questState(s, 'pegging-the-edge')).toBe('done');
  expect(countItem(s, 'brass-peg')).toBe(0);
  expect(countItem(s, 'surveyor-boots')).toBe(1);
  equip(s, 'surveyor-boots');
  expect(defenseOf(s)).toBe(before + ITEMS['surveyor-boots'].def - ITEMS['rubber-boots'].def);
  // Danach die tägliche Zählung der Milben.
  bump(s, surveyor);
  expect(questState(s, 'night-survey')).toBe('active');
  const buttons = countItem(s, 'button');
  for (let turn = 0; turn < 3000 && s.stats.mites - (s.flags.questBase['night-survey']) < 3; turn += 1) {
    const mite = s.creatures.find((c) => c.type === 'mite' && c.respawnAt === null);
    if (!mite) {
      // Die Milben kommen wieder, wenn man weit genug weg ist.
      if (!walkTo(s, 8, 4)) act(s, 'wait');
      act(s, 'wait');
      continue;
    }
    const dir = Object.entries(DIRS).find(([, [dx, dy]]) => s.player.x + dx === mite.x && s.player.y + dy === mite.y);
    if (dir) act(s, dir[0]);
    else {
      const spot = Object.values(DIRS).map(([dx, dy]) => ({ x: mite.x + dx, y: mite.y + dy }))
        .find((p) => tileAt(s.map, p.x, p.y).walkable && !entityAt(s, p.x, p.y));
      if (!spot || !walkTo(s, spot.x, spot.y, 1)) act(s, 'wait');
    }
  }
  bump(s, surveyor);
  expect(questState(s, 'night-survey')).toBe('done');
  expect(countItem(s, 'button')).toBe(buttons + 2);
});

test('Tiefe Adern im Uhrturm brauchen den Rang Pitworker und geben Federstahl', () => {
  const s = playerFor('clocktower');
  bump(s, entity('meadow', 'west-gate'));
  bump(s, entity('town', 'old-pick'));
  bump(s, entity('town', 'tower-door'));
  expect(s.map).toBe('clocktower');
  s.creatures = s.creatures.filter((c) => c.type !== 'great-cog');
  const deep = entity('clocktower', 'deep-vein-north');
  bump(s, deep);
  expect(said(s, MINING.deepText)).toBe(true);
  // Ein Spieler, der schon zwei Nächte gegraben hat (16 Schläge).
  s.player.mining = MINING.ranks.find((r) => r.deep).at;
  bump(s, deep);
  expect(countItem(s, 'springsteel')).toBeGreaterThanOrEqual(1);
  expect(veinLeft(s, deep)).toBe(0);
});

test('Das Federstahlschwert ist die stärkste Waffe und braucht Federstahl und Erz', () => {
  const best = Math.max(...Object.values(ITEMS).filter((i) => i.atk !== undefined && i !== ITEMS['springsteel-sword']).map((i) => i.atk));
  expect(ITEMS['springsteel-sword'].atk).toBeGreaterThan(best);
  const s = createGame({ seed: 3 });
  s.player.bag.push('springsteel', 'springsteel', 'brass-ore', 'brass-ore');
  const sword = RECIPES.find((r) => r.id === 'springsteel-sword');
  expect(canCraft(s, sword)).toBe(false);
  expect(craft(s, 'springsteel-sword')).toBe(false);
  s.player.bag.push('springsteel');
  expect(craft(s, 'springsteel-sword')).toBe(true);
  expect(s.player.weapon).toBe('springsteel-sword');
  expect(attackOf(s)).toBe(s.player.atk + ITEMS['springsteel-sword'].atk);
});

test('Die Axt braucht eine Feder aus Mainspring', () => {
  const s = createGame({ seed: 3 });
  s.player.bag.push('brass-ore', 'brass-ore', 'brass-ore');
  expect(craft(s, 'brass-axe')).toBe(false);
  s.player.bag.push('spring');
  expect(craft(s, 'brass-axe')).toBe(true);
  expect(s.player.weapon).toBe('brass-axe');
});

test('Pit Quota: Der Tinker will jede Nacht drei Erz, nach den Federn', () => {
  const quest = QUESTS.find((q) => q.id === 'pit-quota');
  expect(quest.repeat).toBe('daily');
  expect(quest.after).toBe('loose-springs');
  const s = playerFor('mainspring');
  s.flags.quests = { 'loose-springs': 'done' };
  s.player.bag.push('brass-ore', 'brass-ore', 'brass-ore');
  toTown(s);
  bump(s, entity('town', 'tinker'));
  expect(questState(s, 'pit-quota')).toBe('active');
  bump(s, entity('town', 'tinker'));
  expect(questState(s, 'pit-quota')).toBe('done');
  expect(countItem(s, 'brass-ore')).toBe(0);
});

test('Der Südrand der Wiese ist ausradiert, und Milben sind Kleinvieh mit Krümeln', () => {
  const bottom = MAPS.meadow.tiles.at(-1);
  expect(bottom).toContain('e');
  expect(CREATURES.mite.balance).toEqual({ stage: 'meadow', role: 'fodder' });
  expect(CREATURES.mite.drops.some((d) => d.item === 'crumb')).toBe(true);
  expect(MAPS.meadow.spawns.filter((sp) => sp.type === 'mite').length).toBeGreaterThan(0);
});

test('Alte Spielstände ohne Bergbau laufen, der neue Stand mit Erz lädt', () => {
  const old = JSON.parse(readFileSync('tests/fixtures/save-v1-day7-ink.json', 'utf8'));
  const s = createGame({ seed: 1, saved: old });
  expect(s.player.mining).toBe(0);
  expect(s.stats.ore).toBe(0);
  expect(s.stats.mites).toBe(0);
  expect(miningRank(s)).toBe(0);
  const saved = JSON.parse(readFileSync('tests/fixtures/save-v1-day8-ore.json', 'utf8'));
  const t = createGame({ seed: 1, saved });
  expect(t.player.mining).toBe(9);
  expect(miningRank(t)).toBe(1);
  expect(countItem(t, 'brass-ore')).toBe(2);
  expect(t.player.armor.body).toBe('brass-plate');
  const broken = createGame({ seed: 1, saved: { ...saved, player: { ...saved.player, mining: 'lots' } } });
  expect(broken.player.mining).toBe(0);
});
