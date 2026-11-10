// Gemeinsame Welt: Kreaturen einer Karte für alle Spieler, gerechnet auf dem Server.
import { MAPS } from '../content/world.js';
import { CREATURES } from '../content/creatures.js';
import { WHEEL } from '../content/wheel.js';
import { DIRS, distance } from './core.js';
import { AI_BEHAVIOURS, creatureAt, creatureTurn, hurtPlayer, isFree, newCreature, spawnCreatures, sweepMarks } from './creatures.js';

// Seit Tag 6. Der Server (worker/presence.js) importiert das über src/game.js, führt pro Karte eine Welt mit
// createWorld() und rechnet sie im Takt mit stepWorld(). Dafür nutzt er dieselben AI_BEHAVIOURS:
// Jede Kreatur sieht als s.player den nächsten Spieler, Bisse gehen über s.onHurt an dessen Browser.
// Im Browser setzt applyWorld() die Kreaturen vom Server, takeBite() rechnet einen Biss,
// rewardKill() einen gemeinsamen Sieg. s.shared und s.outbox werden nie gespeichert.

// Nach einem Sieg kommen Bosse in der gemeinsamen Welt nach dieser Zahl Takte wieder, damit Spätere sie auch treffen.
export const WORLD_BOSS_RESPAWN = 900;
// Ein Boss, den so viele Takte lang niemand trifft, ist wieder heil (seit dem Rebalance). Sonst legt man ihn allein,
// indem man ohnmächtig wird, zurückläuft und weiterhaut. Etwa 18 Sekunden: genug für eine Trinkpause, nicht für den Weg vom Bett.
export const WORLD_BOSS_REST = 30;

export function createWorld(mapId, seed = 1) {
  let next = 0;
  const creatures = MAPS[mapId].spawns.map((spawn) => ({ ...newCreature(spawn.type, spawn.x, spawn.y), id: `c${next++}` }));
  return { map: mapId, turn: 0, seed: seed | 0, creatures, next, hitters: {} };
}

const nearest = (c, players) => players.reduce((best, p) => (!best || distance(c, p) < distance(c, best) ? p : best), null);

// Ein Takt. players: [{ id, x, y }] auf dieser Karte. Rückgabe: Bisse [{ id, type }].
export function stepWorld(world, players) {
  const bites = [];
  world.turn += 1;
  sweepMarks(world.creatures);
  const base = { map: world.map, turn: world.turn, seed: world.seed, flags: {}, creatures: world.creatures, others: players };
  for (const c of world.creatures) {
    if (c.respawnAt === null || world.turn < c.respawnAt) continue;
    const view = { ...base, player: { x: -99, y: -99 } };
    if (players.every((p) => distance(c.spawn, p) > 5) && isFree(view, c.spawn.x, c.spawn.y)) {
      Object.assign(c, { x: c.spawn.x, y: c.spawn.y, hp: CREATURES[c.type].hp, respawnAt: null });
      delete world.hitters[c.id];
    }
  }
  for (const c of world.creatures) {
    const def = CREATURES[c.type];
    if (!def?.boss || c.respawnAt !== null || c.hp >= def.hp) continue;
    if (world.turn - (world.lastHit?.[c.id] ?? 0) > WORLD_BOSS_REST) {
      c.hp = def.hp;
      delete world.hitters[c.id];
    }
  }
  if (!players.length) return bites;
  for (const c of world.creatures) {
    const def = CREATURES[c.type];
    if (c.respawnAt !== null || !def || !AI_BEHAVIOURS[def.ai]) continue;
    const target = nearest(c, players);
    const view = {
      ...base,
      seed: world.seed,
      player: { x: target.x, y: target.y },
      others: players.filter((p) => p !== target),
      onHurt: () => bites.push({ id: target.id, type: c.type }),
    };
    creatureTurn(view, c, def);
    world.seed = view.seed;
  }
  // Neue Markierungen von Flächenangriffen bekommen hier ihre id (das Verhalten kennt den Zähler nicht).
  for (const c of world.creatures) if (!c.id) c.id = `c${world.next++}`;
  return bites;
}

// Browser: Wäre dieser Zug ein Angriff? Für die Abklingzeiten in der gemeinsamen Welt.
export function isAttack(s, action) {
  // Trinken (seit dem Rebalance) hat dieselbe Abklingzeit wie ein Schlag.
  if (typeof action === 'string' && action.startsWith('use:')) return true;
  const dir = DIRS[action];
  return Boolean(dir && creatureAt(s, s.player.x + dir[0], s.player.y + dir[1]));
}

// Ein Spieler trifft eine Kreatur. Rückgabe: null (ungültig), { killed: false } oder { killed: true, type, hitters }.
export function hitWorld(world, id, dmg, player) {
  const c = world.creatures.find((x) => x.id === id && x.respawnAt === null);
  if (!c || distance(c, player) !== 1) return null;
  const def = CREATURES[c.type];
  c.hp -= dmg;
  (world.lastHit ??= {})[c.id] = world.turn;
  const hitters = (world.hitters[c.id] ??= []);
  if (!hitters.includes(player.id)) hitters.push(player.id);
  if (c.hp > 0) return { killed: false };
  delete world.hitters[c.id];
  if (c.once) world.creatures.splice(world.creatures.indexOf(c), 1);
  else c.respawnAt = world.turn + (def.boss ? WORLD_BOSS_RESPAWN : def.respawnTurns);
  return { killed: true, type: c.type, hitters };
}

// Besucher vom Glücksrad in der gemeinsamen Welt. Nur Kreaturen, die das Rad wirklich bringt.
export function summonWorld(world, type, x, y) {
  if (!WHEEL.wedges.some((w) => w.effect === 'visitor' && w.creature === type)) return false;
  const view = { map: world.map, flags: {}, creatures: world.creatures, player: { x: -99, y: -99 }, others: [] };
  if (!isFree(view, x, y)) return false;
  world.creatures.push({ ...newCreature(type, x, y, true), id: `c${world.next++}` });
  return true;
}

// Browser: Kreaturen vom Server übernehmen. Unbekannte Arten (ältere Spielversion) bleiben weg.
export function applyWorld(s, creatures) {
  s.shared = true;
  s.worldMap = s.map;
  s.outbox ??= [];
  s.creatures = creatures
    .filter((c) => CREATURES[c.type])
    .map((c) => ({ id: c.id, type: c.type, x: c.x, y: c.y, hp: c.hp, spawn: { x: c.x, y: c.y }, respawnAt: null, once: false }));
}

// Browser: zurück zur eigenen Welt (keine Verbindung, oder der Server kennt diese Karte nicht).
export function leaveWorld(s) {
  if (!s.shared) return;
  s.shared = false;
  s.worldMap = null;
  s.outbox = [];
  s.creatures = spawnCreatures(s, s.map).filter((c) => !(c.x === s.player.x && c.y === s.player.y));
}

// Browser: Biss vom Server. Rückgabe true, wenn der Spieler ohnmächtig wurde (und auf der Wiese aufwacht).
export function takeBite(s, type) {
  const def = CREATURES[type];
  if (!def) return false;
  return hurtPlayer(s, def);
}
