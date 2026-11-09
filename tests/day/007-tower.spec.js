// Tag 7: der krumme Turm mit Zaubern aus Tinte (Gewinner von Zettel 6), der Great Cog im Uhrturm mit Kuckucken
// (Vorschläge: ein Boss für eine Gruppe, Kämpfe, bei denen man nachdenken muss), Tintenkrähen für die Vogelscheuche
// und das Event "Bottled Ink" (eigene Idee). Dazu die Aufteilung von src/game.js in Module (Aufräumnacht).
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import {
  act, activeEvent, AI_BEHAVIOURS, attackOf, countItem, createGame, createWorld, damageTo, entityAt, hitWorld,
  hopTarget, isAttack, knownSpells, questState, rewardKill, stepWorld, takeBite, tileAt,
} from '../../src/game.js';
import { MAPS } from '../../content/world.js';
import { CREATURES } from '../../content/creatures.js';
import { ITEMS } from '../../content/items.js';
import { SPELLS } from '../../content/spells.js';
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
const place = (s, type, x, y) => {
  const c = { type, x, y, hp: CREATURES[type].hp, spawn: { x, y }, respawnAt: null, once: false };
  s.creatures.push(c);
  return c;
};

// Alle Felder, die man von (x, y) aus zu Fuß erreicht (Dinge blockieren, sind aber selbst erreichbar).
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

test('Krumme Tür auf der Wiese und Uhrturm in Mainspring führen hin und zurück', () => {
  const s = quiet('meadow', 7, 2);
  expect(entityAt(s, 7, 1)?.id).toBe('crooked-door');
  act(s, 'up');
  expect([s.map, s.player.x, s.player.y]).toEqual(['tower', 7, 7]);
  act(s, 'down');
  expect([s.map, s.player.x, s.player.y]).toEqual(['meadow', 7, 2]);
  expect(reachable('meadow', 8, 5).has('7,1')).toBe(true);

  const t = quiet('town', 13, 3);
  act(t, 'right');
  expect([t.map, t.player.x, t.player.y]).toEqual(['clocktower', 2, 5]);
  t.creatures = [];
  act(t, 'left');
  act(t, 'left');
  expect([t.map, t.player.x, t.player.y]).toEqual(['town', 13, 3]);
});

test('Turm und Uhrturm: alles zu Fuß erreichbar, nur Nische und Insel brauchen HOP', () => {
  const hopOnly = ['margin-note', 'alcove-ink', 'gear-chest'];
  for (const [map, start] of [['tower', [7, 7]], ['clocktower', [2, 5]]]) {
    const seen = reachable(map, ...start);
    for (const e of MAPS[map].entities) expect(seen.has(`${e.x},${e.y}`), e.id).toBe(!hopOnly.includes(e.id));
    for (const sp of MAPS[map].spawns) expect(seen.has(`${sp.x},${sp.y}`), sp.type).toBe(true);
  }
  // Mit HOP kommt man hinein und wieder heraus.
  const s = quiet('tower', 12, 3);
  s.player.bag.push('tome-hop', 'ink', 'ink');
  expect(act(s, 'cast:hop:right')).toBe(true);
  expect([s.player.x, s.player.y]).toEqual([14, 3]);
  act(s, 'down');
  expect(countItem(s, 'ink')).toBe(2);
  act(s, 'cast:hop:left');
  expect([s.player.x, s.player.y]).toEqual([12, 3]);
  expect(countItem(s, 'ink')).toBe(1);

  const c = quiet('clocktower', 7, 3);
  c.player.bag.push('tome-hop', 'ink');
  act(c, 'cast:hop:down');
  expect([c.player.x, c.player.y]).toEqual([7, 5]);
  act(c, 'right');
  expect(c.player.armor.feet).toBe('brass-greaves');
});

test('HOP springt nicht über Dinge, nicht in Wände und nicht ohne Buch oder Tinte', () => {
  // Über das Sumpfgitter darf man nicht hüpfen, sonst bräuchte niemand den Schlüssel.
  const s = quiet('drains', 24, 6);
  s.player.bag.push('tome-hop', 'ink');
  expect(entityAt(s, 24, 7)?.id).toBe('sump-gate');
  expect(hopTarget(s, 'down')).toBe(null);
  expect(act(s, 'cast:hop:down')).toBe(false);
  expect([s.player.x, s.player.y, countItem(s, 'ink')]).toEqual([24, 6, 1]);
  // In eine Wand nicht, über eine Kreatur schon.
  const w = quiet('tower', 3, 3);
  w.player.bag.push('tome-hop', 'ink');
  expect(hopTarget(w, 'left')).toBe(null);
  place(w, 'page', 4, 3);
  expect(hopTarget(w, 'right')).toEqual({ x: 5, y: 3 });
  // Ohne Buch kein Zauber, ohne Tinte auch nicht.
  const n = quiet('tower', 12, 3);
  n.player.bag.push('ink');
  expect(act(n, 'cast:hop:right')).toBe(false);
  n.player.bag = ['tome-hop'];
  expect(act(n, 'cast:hop:right')).toBe(false);
  expect(n.log.at(-1).text).toContain('ink');
});

test('Tintenfass: zwei Tropfen pro Nacht, sie zählen fürs Event', () => {
  const s = quiet('tower', 5, 3);
  act(s, 'up');
  expect(countItem(s, 'ink')).toBe(2);
  expect(s.stats.ink).toBe(2);
  act(s, 'up');
  expect(countItem(s, 'ink')).toBe(2);
  expect(s.log.at(-1).text).toContain('dry');
});

test('Magierin: Lehrling mit zwei Tropfen, dann drei Zauber für das Buch des Heilens', () => {
  const s = quiet('tower', 8, 3);
  act(s, 'up');
  expect(questState(s, 'apprentice')).toBe('active');
  s.player.bag.push('ink', 'ink');
  act(s, 'up');
  expect(questState(s, 'apprentice')).toBe('done');
  expect(knownSpells(s).map((x) => x.id)).toEqual(['ward']);
  act(s, 'up');
  expect(questState(s, 'second-lesson')).toBe('active');
  s.player.bag.push('ink', 'ink', 'ink');
  for (let i = 0; i < 3; i += 1) expect(act(s, 'cast:ward')).toBe(true);
  expect(s.stats.spells).toBe(3);
  act(s, 'up');
  expect(questState(s, 'second-lesson')).toBe('done');
  expect(knownSpells(s).map((x) => x.id)).toEqual(['ward', 'mend']);
});

test('WARD hält drei Bisse ab, auch Bisse aus der gemeinsamen Welt; MEND heilt sechs', () => {
  const s = quiet('meadow', 8, 5);
  s.player.bag.push('tome-ward', 'tome-mend', 'ink', 'ink', 'ink');
  act(s, 'cast:ward');
  expect(s.player.ward).toBe(3);
  for (let i = 0; i < 3; i += 1) takeBite(s, 'frog');
  expect(s.player.hp).toBe(s.player.maxHp);
  expect(s.player.ward).toBe(0);
  takeBite(s, 'frog');
  expect(s.player.hp).toBe(s.player.maxHp - 2);
  expect(act(s, 'cast:mend')).toBe(true);
  expect(s.player.hp).toBe(s.player.maxHp);
  expect(act(s, 'cast:mend')).toBe(false);
  expect(countItem(s, 'ink')).toBe(1);
  // Zauber zählen in der gemeinsamen Welt nicht als Schlag.
  expect(isAttack(s, 'cast:ward')).toBe(false);
});

test('Great Cog: gepanzert, festgeschraubt, Zähne reichen in gerader Linie zwei Felder', () => {
  const def = CREATURES['great-cog'];
  const s = quiet('clocktower', 15, 3);
  const cog = place(s, 'great-cog', 15, 5);
  expect(damageTo(s, 'great-cog')).toBe(Math.max(1, attackOf(s) - def.def));
  // Schräg daneben ist man sicher, egal in welcher Runde.
  s.player.x = 16;
  s.player.y = 4;
  for (let turn = 0; turn < 20; turn += 1) {
    s.turn = turn;
    AI_BEHAVIOURS.grind(s, cog, { ...def, hitChance: 1 });
  }
  expect(s.player.hp).toBe(s.player.maxHp);
  expect([cog.x, cog.y]).toEqual([15, 5]);
  // Zwei Felder in gerader Linie: nur in geraden Runden.
  s.player.x = 15;
  s.player.y = 3;
  s.player.hp = 99;
  s.player.maxHp = 99;
  s.turn = 1;
  AI_BEHAVIOURS.grind(s, cog, { ...def, hitChance: 1 });
  expect(s.player.hp).toBe(99);
  s.turn = 2;
  AI_BEHAVIOURS.grind(s, cog, { ...def, hitChance: 1 });
  expect(s.player.hp).toBeLessThan(99);
  // Boss: einmalig, mit Zahn als Beute.
  rewardKill(s, 'great-cog', 'Down it goes.');
  expect(s.flags.slain['great-cog']).toBe(true);
  expect(s.player.weapon).toBe('cog-tooth');
  expect(s.log.some((l) => l.text === def.defeatText)).toBe(true);
  const again = createGame({ saved: { ...s, version: 1 }, seed: 2 });
  again.map = 'clocktower';
  expect(MAPS.clocktower.spawns.some((sp) => sp.type === 'great-cog')).toBe(true);
});

test('Kuckuck spuckt nur bei freier Linie und weicht aus, wenn man nah kommt', () => {
  const def = { ...CREATURES.cuckoo, hitChance: 1 };
  const s = quiet('clocktower', 12, 7);
  const bird = place(s, 'cuckoo', 12, 3);
  s.player.hp = 50;
  AI_BEHAVIOURS.aim(s, bird, def);
  expect(s.player.hp).toBe(50 - Math.max(1, def.atk));
  // Etwas dazwischen: kein Schuss.
  place(s, 'page', 12, 5);
  s.player.hp = 50;
  AI_BEHAVIOURS.aim(s, bird, def);
  expect(s.player.hp).toBe(50);
  // Daneben: Er weicht aus, statt zu picken.
  s.creatures = [bird];
  bird.x = 12;
  bird.y = 6;
  AI_BEHAVIOURS.aim(s, bird, def);
  expect(Math.abs(bird.x - 12) + Math.abs(bird.y - 7)).toBe(2);
  expect(s.player.hp).toBe(50);
});

test('Tintenkrähen picken und flattern weg; vier verjagte Krähen bringen den Federmantel', () => {
  const def = { ...CREATURES.crow, hitChance: 1 };
  const s = quiet('draft', 6, 4);
  const crow = place(s, 'crow', 6, 3);
  s.player.hp = 50;
  AI_BEHAVIOURS.swoop(s, crow, def);
  expect(s.player.hp).toBe(48);
  expect(Math.abs(crow.x - 6) + Math.abs(crow.y - 4)).toBe(2);
  expect(MAPS.draft.spawns.filter((sp) => sp.type === 'crow')).toHaveLength(2);

  const q = quiet('draft', 12, 6);
  act(q, 'up'); // erst das Geschenk von Tag 6 (Ersatzhut)
  act(q, 'up');
  expect(questState(q, 'crow-season')).toBe(null); // ohne Tinte noch kein Auftrag
  q.player.bag.push('ink');
  act(q, 'up');
  expect(questState(q, 'crow-season')).toBe('active');
  for (let i = 0; i < 4; i += 1) rewardKill(q, 'crow', 'Shoo.');
  expect(q.stats.crows).toBe(4);
  act(q, 'up');
  expect(questState(q, 'crow-season')).toBe('done');
  expect(q.player.armor.body).toBe('crow-coat');
});

test('Gemeinsame Welt rechnet Turm und Uhrturm mit denselben Verhalten', () => {
  for (const map of ['tower', 'clocktower', 'draft']) {
    const world = createWorld(map, 5);
    const players = [{ id: 'a', x: 2, y: 5 }, { id: 'b', x: 7, y: 7 }].filter((p) => tileAt(map, p.x, p.y).walkable);
    for (let i = 0; i < 40; i += 1) stepWorld(world, players);
    for (const c of world.creatures) expect(tileAt(map, c.x, c.y).walkable, `${map} ${c.type}`).toBe(true);
  }
  // Der Great Cog bleibt stehen und lässt sich gemeinsam legen.
  const world = createWorld('clocktower', 5);
  const cog = world.creatures.find((c) => c.type === 'great-cog');
  for (let i = 0; i < 10; i += 1) stepWorld(world, [{ id: 'a', x: 15, y: 4 }, { id: 'b', x: 14, y: 5 }]);
  expect([cog.x, cog.y]).toEqual([15, 5]);
  let result = null;
  for (let i = 0; result?.killed !== true && i < 60; i += 1) {
    result = hitWorld(world, cog.id, 8, i % 2 ? { id: 'a', x: 15, y: 4 } : { id: 'b', x: 14, y: 5 });
  }
  expect(result.killed).toBe(true);
  expect(result.hitters.sort()).toEqual(['a', 'b']);
});

test('Event "Bottled Ink" beginnt bei der Magierin und zählt Tinte', () => {
  expect(EVENT.id).toBe('bottled-ink');
  expect(EVENT.giver).toBe('mage');
  expect(MAPS.tower.entities.some((e) => e.id === 'mage' && e.kind === 'npc')).toBe(true);
  expect(ITEMS.ink.stat).toBe(EVENT.stat);
  const s = createGame({ seed: 1 });
  expect(s.stats.ink).toBe(0);
});

test('Alte Spielstände laden ohne neue Felder, der neue Stand mit Tinte und Zaubern auch', () => {
  for (const name of ['save-v1-day0.json', 'save-v1-day6-knacks.json']) {
    const saved = JSON.parse(readFileSync(`tests/fixtures/${name}`, 'utf8'));
    const s = createGame({ saved, seed: 1 });
    expect(s.player.ward).toBe(0);
    expect([s.stats.ink, s.stats.spells, s.stats.crows]).toEqual([0, 0, 0]);
    expect(knownSpells(s)).toEqual([]);
  }
  const s = createGame({ saved: JSON.parse(readFileSync('tests/fixtures/save-v1-day7-ink.json', 'utf8')), seed: 1 });
  expect(s.map).toBe('tower');
  expect(s.player.ward).toBe(2);
  expect(knownSpells(s).map((x) => x.id)).toEqual(['ward', 'hop']);
  expect(s.player.armor).toEqual({ head: 'brass-helm', body: 'crow-coat', feet: 'brass-greaves' });
  // Kaputter Tintenring wird verworfen.
  const broken = createGame({ saved: { version: 1, map: 'meadow', player: { x: 8, y: 5, hp: 5, maxHp: 10, atk: 1, ward: 'lots' } }, seed: 1 });
  expect(broken.player.ward).toBe(0);
  expect(SPELLS.every((spell) => Object.values(ITEMS).some((item) => item.spell === spell.id))).toBe(true);
});

test('Im Browser: Zauberleiste, Taste 1 für WARD, Taste 2 und eine Richtung für HOP', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('overnight.save', JSON.stringify({
      version: 1, map: 'tower', turn: 3, lastSeenDay: 7, stats: {},
      flags: { eventsHeard: { 'bottled-ink': true } },
      player: { x: 12, y: 3, hp: 10, maxHp: 10, atk: 1, bag: ['tome-ward', 'tome-hop', 'ink', 'ink', 'ink'] },
    }));
  });
  await page.goto('/?seed=3');
  await page.waitForFunction(() => window.__overnight);
  await page.evaluate(() => { window.__overnight.state.creatures = []; });
  await expect(page.locator('#spell-bar')).toBeVisible();
  await expect(page.locator('#spell-ink')).toHaveText('INK 3');
  await expect(page.locator('#spell-buttons button')).toHaveText(['Ward', 'Hop']);
  await page.keyboard.press('1');
  await expect(page.locator('#spell-ink')).toHaveText('INK 2 · WARD 3');
  await page.keyboard.press('2');
  await expect(page.locator('[data-spell="hop"]')).toHaveClass(/armed/);
  await page.keyboard.press('ArrowRight');
  const pos = await page.evaluate(() => [window.__overnight.state.player.x, window.__overnight.state.player.y]);
  expect(pos).toEqual([14, 3]);
  await expect(page.locator('#spell-ink')).toHaveText('INK 1 · WARD 3');
  // Knopf HOP und Escape: wieder abbrechen.
  await page.locator('[data-spell="hop"]').click();
  await expect(page.locator('[data-spell="hop"]')).toHaveClass(/armed/);
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-spell="hop"]')).not.toHaveClass(/armed/);
});

test('Figuren bemerken jetzt auch Rüstung und Bücher, nicht nur die Waffe in der Hand', () => {
  const s = quiet('draft', 12, 6);
  s.flags.gifts = { scarecrow: true };
  s.player.armor.body = 'crow-coat';
  act(s, 'up');
  expect(s.log.at(-1).text).toContain('The coat suits you');
  act(s, 'up');
  expect(s.log.at(-1).text).not.toContain('The coat suits you');
  // Die Waffe in der Hand kommt zuerst dran.
  const k = quiet('meadow', 12, 6);
  k.player.weapon = 'stick';
  k.player.bag.push('tome-ward');
  act(k, 'up');
  expect(k.log.at(-1).text).toContain('stick');
  act(k, 'up');
  expect(k.log.at(-1).text).toContain('spellbook');
});

