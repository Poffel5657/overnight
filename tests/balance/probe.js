// Der Probespieler: kämpft gegen eine Kreatur wie ein Spieler, der sein Spiel kennt.
// Zwei Welten, wie im echten Spiel:
//   solo():   allein und rundenweise (ohne Verbindung) über act(), genau wie das Spiel selbst.
//   shared(): gemeinsame Welt im Takt (PRESENCE.tickMs) über createWorld/stepWorld/hitWorld, mit 1 bis n Spielern
//             und den Abklingzeiten aus PRESENCE (moveMs, attackMs), in 100-ms-Schritten.
// Der Probespieler nutzt, was er dabeihat: Getränke und MEND, wenn die HP knapp werden, WARD vor dem Boss.
// Taktiken: 'stand' (hinlaufen, hauen), 'kite' (zuschlagen und ausweichen), 'wait' (stehen bleiben, kommen lassen),
// 'dance' (nur zwischen zwei Takten zuschlagen und vor dem nächsten Takt wegtreten). Am Ende zählt die beste, denn Spieler finden sie auch.
import {
  act, createGame, createWorld, damageTo, entityAt, gainXp, giveItem, hitWorld, learnSkill, newCreature, skillPoints,
  stepWorld, takeBite, tileAt, useItem,
} from '../../src/game.js';
import { MAPS } from '../../content/world.js';
import { CREATURES } from '../../content/creatures.js';
import { ITEMS } from '../../content/items.js';
import { LEVELS } from '../../content/levels.js';
import { PRESENCE } from '../../content/presence.js';
import { ROLES, SKILL_ORDER, STAGES } from '../../content/balance.js';

const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const dist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

// Ein Spieler, wie er an einem Ort ankommt (content/balance.js).
export function playerFor(stageId, seed = 1) {
  const stage = STAGES[stageId];
  if (!stage) throw new Error(`Unbekannte Stufe ${stageId}`);
  const s = createGame({ seed });
  s.flags.eventsHeard = { all: true };
  gainXp(s, LEVELS[stage.level - 1].xp);
  for (let i = 0; skillPoints(s) > 0 && i < 50; i += 1) learnSkill(s, SKILL_ORDER[i % SKILL_ORDER.length]);
  if (stage.weapon) giveItem(s, stage.weapon);
  for (const id of stage.armor ?? []) giveItem(s, id);
  for (const id of stage.bag ?? []) giveItem(s, id);
  s.player.hp = s.player.maxHp;
  s.log = [];
  return s;
}

// Freies Feld für den Probespieler: begehbar, kein Ding, keine Kreatur, kein anderer Spieler.
const passable = (s, creatures, others, x, y) =>
  tileAt(s.map, x, y).walkable && !entityAt(s, x, y) &&
  !creatures.some((c) => c.respawnAt === null && c.x === x && c.y === y) &&
  !others.some((p) => p.x === x && p.y === y);

// Erster Schritt eines kürzesten Weges zu einem Feld, das goal() erfüllt. null, wenn keiner da ist.
function firstStep(s, from, creatures, others, goal) {
  const seen = new Set([`${from.x},${from.y}`]);
  const queue = [{ x: from.x, y: from.y, first: null }];
  while (queue.length) {
    const cur = queue.shift();
    if (cur.first && goal(cur)) return cur.first;
    for (const [name, [dx, dy]] of Object.entries(DIRS)) {
      const x = cur.x + dx;
      const y = cur.y + dy;
      const key = `${x},${y}`;
      if (seen.has(key) || !passable(s, creatures, others, x, y)) continue;
      seen.add(key);
      queue.push({ x, y, first: cur.first ?? name });
    }
  }
  return null;
}

// Startfeld: ein erreichbares Feld etwa vier Schritte von der Kreatur entfernt.
function startNear(s, target) {
  const seen = new Set([`${target.x},${target.y}`]);
  let ring = [{ x: target.x, y: target.y }];
  let best = null;
  for (let step = 1; step <= 4 && ring.length; step += 1) {
    const next = [];
    for (const cur of ring) {
      for (const [dx, dy] of Object.values(DIRS)) {
        const x = cur.x + dx;
        const y = cur.y + dy;
        const key = `${x},${y}`;
        if (seen.has(key) || !passable(s, [], [], x, y)) continue;
        seen.add(key);
        next.push({ x, y });
      }
    }
    if (next.length) best = next;
    ring = next;
  }
  return best?.[0] ?? null;
}

// Liegt (x, y) im Wirkbereich der Kreatur (daneben oder in gerader Linie in Reichweite)?
function threatened(def, c, x, y) {
  const d = Math.abs(c.x - x) + Math.abs(c.y - y);
  if (d === 1) return true;
  const reach = def.reach ?? (def.ai === 'aim' ? def.senseRange : 1);
  return d <= reach && (c.x === x || c.y === y);
}

const heals = (s) => s.player.bag.filter((id) => ITEMS[id]?.heal).sort((a, b) => ITEMS[a].heal - ITEMS[b].heal);
const inkLeft = (s) => s.player.bag.filter((id) => id === 'ink').length;
const knows = (s, tome) => s.player.bag.includes(tome);

// Getränk nehmen. Seit dem Rebalance kostet das eine Runde (act 'use:<id>'); ältere Stände kannten das nicht.
function drink(s, id) {
  if (act(s, `use:${id}`)) return true;
  return useItem(s, id);
}

// Was der Probespieler mit seinen Vorräten tut, bevor er kämpft. Rückgabe: Aktion oder null.
function supplies(s, def, adjacent) {
  const low = s.player.hp <= s.player.maxHp * 0.4;
  if (low) {
    const mendable = knows(s, 'tome-mend') && inkLeft(s) > 0 && s.player.maxHp - s.player.hp >= 6;
    const potion = heals(s).find((id) => s.player.maxHp - s.player.hp >= ITEMS[id].heal) ?? heals(s)[0];
    if (potion) return { drink: potion };
    if (mendable) return { act: 'cast:mend' };
  }
  if (def.boss && adjacent && !s.player.ward && knows(s, 'tome-ward') && inkLeft(s) > 1) return { act: 'cast:ward' };
  return null;
}

// Allein und rundenweise. Rückgabe { win, hpLost, turns }.
export function solo(type, { stage, tactic = 'stand', seed = 1, maxTurns = 800 } = {}) {
  const def = CREATURES[type];
  const s = playerFor(stage ?? def.balance.stage, seed);
  const mapId = Object.keys(MAPS).find((id) => MAPS[id].spawns.some((sp) => sp.type === type));
  const spawn = MAPS[mapId].spawns.find((sp) => sp.type === type);
  s.map = mapId;
  const c = newCreature(type, spawn.x, spawn.y);
  s.creatures = [c];
  const start = startNear(s, c);
  Object.assign(s.player, start);
  let lost = 0;
  let lastHp = s.player.hp;
  const faints = s.stats.faints;
  let justHit = false;
  for (let turn = 0; turn < maxTurns; turn += 1) {
    if (s.stats.faints > faints || s.map !== mapId) return { win: false, hpLost: 1, turns: turn };
    if (c.hp <= 0 || c.respawnAt !== null || !s.creatures.includes(c)) {
      return { win: true, hpLost: lost / s.player.maxHp, turns: turn };
    }
    const adjacent = dist(c, s.player) === 1;
    const plan = supplies(s, def, adjacent);
    let action = null;
    if (plan?.drink) {
      drink(s, plan.drink);
    } else if (plan?.act) {
      action = plan.act;
    } else if (adjacent && !(tactic === 'kite' && justHit)) {
      action = Object.keys(DIRS).find((d) => s.player.x + DIRS[d][0] === c.x && s.player.y + DIRS[d][1] === c.y);
    } else if (tactic === 'wait' && !adjacent) {
      action = 'wait';
    } else if (tactic === 'kite' && justHit) {
      action = firstStep(s, s.player, s.creatures, [], (p) => !threatened(def, c, p.x, p.y)) ?? 'wait';
    } else {
      action = firstStep(s, s.player, s.creatures, [], (p) => dist(p, c) === 1) ?? 'wait';
    }
    justHit = Boolean(action && adjacent && DIRS[action] && dist(c, s.player) === 1 && !plan);
    if (action) act(s, action);
    if (s.player.hp < lastHp) lost += lastHp - s.player.hp;
    lastHp = s.player.hp;
  }
  return { win: false, hpLost: 1, turns: maxTurns };
}

// Gemeinsame Welt: n Spieler gegen eine Kreatur, im Takt des Servers. Rückgabe { win, hpLost, ticks, down }.
export function shared(type, { stage, players = 1, tactic = 'stand', seed = 1, maxTicks = 800 } = {}) {
  const def = CREATURES[type];
  const mapId = Object.keys(MAPS).find((id) => MAPS[id].spawns.some((sp) => sp.type === type));
  const world = createWorld(mapId, seed);
  world.creatures = world.creatures.filter((c) => c.type === type).slice(0, 1);
  const c = world.creatures[0];
  const tickMs = Math.max(300, PRESENCE.tickMs ?? 700);
  const moveMs = PRESENCE.moveMs ?? 200;
  const attackMs = PRESENCE.attackMs ?? 500;
  const drinkMs = attackMs;
  const bots = [];
  for (let i = 0; i < players; i += 1) {
    const s = playerFor(stage ?? def.balance.stage, seed * 31 + i);
    s.map = mapId;
    s.creatures = [];
    const others = bots.map((b) => b.pos);
    const start = firstFree(s, c, others);
    bots.push({ id: `p${i}`, s, pos: { ...start }, readyAt: 0, out: false, lost: 0, lastHp: s.player.hp, faints: s.stats.faints });
  }
  for (let t = 0, tick = 0; tick < maxTicks; t += 100) {
    for (const bot of bots) {
      if (bot.out || t < bot.readyAt) continue;
      const others = bots.filter((b) => b !== bot && !b.out).map((b) => b.pos);
      const { s } = bot;
      Object.assign(s.player, bot.pos);
      const adjacent = dist(c, bot.pos) === 1;
      const nextTick = (tick + 1) * tickMs;
      const plan = supplies(s, def, adjacent);
      if (plan?.drink) {
        drink(s, plan.drink);
        bot.readyAt = t + drinkMs;
        continue;
      }
      if (plan?.act) {
        act(s, plan.act);
        bot.readyAt = t + moveMs;
        continue;
      }
      const canDodge = t + attackMs < nextTick - 50;
      if (adjacent && (tactic !== 'dance' || canDodge)) {
        const result = hitWorld(world, c.id, damageTo(s, type), { id: bot.id, ...bot.pos });
        bot.readyAt = t + attackMs;
        if (result?.killed) {
          return { win: true, hpLost: avgLost(bots), ticks: tick, down: bots.filter((b) => b.out).length };
        }
        continue;
      }
      let dir;
      if (tactic === 'wait') {
        dir = null;
      } else if (tactic === 'dance' && threatened(def, c, bot.pos.x, bot.pos.y)) {
        dir = firstStep(s, bot.pos, world.creatures, others, (p) => !threatened(def, c, p.x, p.y));
      } else if (tactic === 'dance' && t + moveMs + attackMs >= nextTick - 50) {
        dir = null;
      } else {
        dir = firstStep(s, bot.pos, world.creatures, others, (p) => dist(p, c) === 1);
      }
      if (dir) {
        bot.pos = { x: bot.pos.x + DIRS[dir][0], y: bot.pos.y + DIRS[dir][1] };
        bot.readyAt = t + moveMs;
      }
    }
    if (t + 100 >= (tick + 1) * tickMs) {
      tick += 1;
      const active = bots.filter((b) => !b.out);
      if (!active.length) break;
      const bites = stepWorld(world, active.map((b) => ({ id: b.id, x: b.pos.x, y: b.pos.y })));
      for (const bite of bites) {
        const bot = bots.find((b) => b.id === bite.id);
        if (!bot || bot.out) continue;
        Object.assign(bot.s.player, bot.pos);
        bot.s.map = mapId;
        takeBite(bot.s, bite.type);
        if (bot.s.stats.faints > bot.faints) {
          bot.out = true;
          bot.lost = bot.s.player.maxHp;
          continue;
        }
        if (bot.s.player.hp < bot.lastHp) bot.lost += bot.lastHp - bot.s.player.hp;
        bot.lastHp = bot.s.player.hp;
      }
      for (const bot of bots) bot.lastHp = bot.s.player.hp;
    }
  }
  return { win: false, hpLost: 1, ticks: maxTicks, down: bots.filter((b) => b.out).length };
}

function firstFree(s, c, others) {
  const seen = new Set();
  const queue = [{ x: c.x, y: c.y, d: 0 }];
  while (queue.length) {
    const cur = queue.shift();
    for (const [dx, dy] of Object.values(DIRS)) {
      const x = cur.x + dx;
      const y = cur.y + dy;
      const key = `${x},${y}`;
      if (seen.has(key) || !passable(s, [], others, x, y) || (x === c.x && y === c.y)) continue;
      seen.add(key);
      if (cur.d + 1 >= 3) return { x, y };
      queue.push({ x, y, d: cur.d + 1 });
    }
  }
  throw new Error('Kein Startfeld');
}

const avgLost = (bots) => bots.reduce((sum, b) => sum + Math.min(1, b.lost / b.s.player.maxHp), 0) / bots.length;

const TACTICS_SOLO = ['stand', 'kite', 'wait'];
const TACTICS_SHARED = ['stand', 'dance', 'wait'];

function summary(runs) {
  const wins = runs.filter((r) => r.win);
  return {
    win: wins.length / runs.length,
    hpLost: wins.length ? wins.reduce((sum, r) => sum + r.hpLost, 0) / wins.length : 1,
  };
}

// Bewertet eine Kreatur gegen ihre Rolle. Rückgabe: Messwerte und eine Liste von Problemen (leer = passt).
export function judge(type, { runs = 60 } = {}) {
  const def = CREATURES[type];
  const role = ROLES[def.balance?.role];
  if (!role) return { type, problems: [`${type}: keine balance.role in content/creatures.js`] };
  const seeds = Array.from({ length: runs }, (_, i) => i + 1);
  const best = (results) => results.reduce((a, b) => (b.win > a.win || (b.win === a.win && b.hpLost < a.hpLost) ? b : a));
  const soloTurns = best(TACTICS_SOLO.map((tactic) => ({ tactic, ...summary(seeds.map((seed) => solo(type, { tactic, seed }))) })));
  const soloLive = best(TACTICS_SHARED.map((tactic) => ({ tactic, ...summary(seeds.map((seed) => shared(type, { tactic, seed }))) })));
  const out = { type, role: def.balance.role, stage: def.balance.stage, soloTurns, soloLive, problems: [] };
  const [minWin, maxWin] = role.soloWin;
  const [minLost, maxLost] = role.hpLost;
  for (const [label, r] of [['allein (rundenweise)', soloTurns], ['allein (gemeinsame Welt)', soloLive]]) {
    if (r.win < minWin) out.problems.push(`${type} ${label}: gewinnt nur ${pct(r.win)}, Rolle ${out.role} will mindestens ${pct(minWin)}`);
    if (r.win > maxWin) out.problems.push(`${type} ${label}: gewinnt ${pct(r.win)} (${r.tactic}), Rolle ${out.role} erlaubt höchstens ${pct(maxWin)}`);
    if (r.win > 0 && r.win >= minWin && r.hpLost < minLost) out.problems.push(`${type} ${label}: kostet nur ${pct(r.hpLost)} HP, Rolle ${out.role} will mindestens ${pct(minLost)}`);
    if (r.win > 0 && r.hpLost > maxLost) out.problems.push(`${type} ${label}: kostet ${pct(r.hpLost)} HP, Rolle ${out.role} erlaubt höchstens ${pct(maxLost)}`);
  }
  if (role.group) {
    const g = best(TACTICS_SHARED.map((tactic) =>
      ({ tactic, ...summary(seeds.map((seed) => shared(type, { tactic, seed, players: role.group.size }))) })));
    out.group = g;
    if (g.win < role.group.minWin) {
      out.problems.push(`${type} zu ${role.group.size}.: gewinnt nur ${pct(g.win)}, Rolle ${out.role} will mindestens ${pct(role.group.minWin)}`);
    }
    const [gMin, gMax] = role.group.hpLost ?? [0, 1];
    if (g.win > 0 && g.hpLost < gMin) out.problems.push(`${type} zu ${role.group.size}.: kostet nur ${pct(g.hpLost)} HP, Rolle ${out.role} will mindestens ${pct(gMin)}`);
    if (g.win > 0 && g.hpLost > gMax) out.problems.push(`${type} zu ${role.group.size}.: kostet ${pct(g.hpLost)} HP, Rolle ${out.role} erlaubt höchstens ${pct(gMax)}`);
  }
  return out;
}

export const pct = (x) => `${Math.round(x * 100)} %`;
