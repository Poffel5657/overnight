// Reine Spiellogik ohne DOM. Alles Spielbare läuft über act(), damit die Tests es direkt prüfen können.
import { MAPS, PLAYER, START } from '../content/world.js';
import { TILES } from '../content/tiles.js';
import { CREATURES } from '../content/creatures.js';
import { CHRONICLE } from '../content/chronicle.js';
import { ITEMS } from '../content/items.js';

const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const LOG_LIMIT = 50;

export const currentDay = () => CHRONICLE[CHRONICLE.length - 1].day;

// Eigener Zufall mit Seed (mulberry32), damit Abläufe in Tests wiederholbar sind.
function random(s) {
  s.seed = (s.seed + 0x6d2b79f5) | 0;
  let t = s.seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function log(s, text, kind = '') {
  s.log.push({ text, kind });
  if (s.log.length > LOG_LIMIT) s.log.shift();
}

export function tileAt(mapId, x, y) {
  const row = MAPS[mapId].tiles[y];
  return TILES[row?.[x] ?? ' '] ?? TILES[' '];
}

// Aufgehobene Gegenstände verschwinden dauerhaft von der Karte.
export const visibleEntities = (s) =>
  MAPS[s.map].entities.filter((e) => !s.flags.taken?.[e.id]);

export const entityAt = (s, x, y) =>
  visibleEntities(s).find((e) => e.x === x && e.y === y);

export const attackOf = (s) => s.player.atk + (ITEMS[s.player.weapon]?.atk ?? 0);

export const creatureAt = (s, x, y) =>
  s.creatures.find((c) => c.respawnAt === null && c.x === x && c.y === y);

const isFree = (s, x, y) =>
  tileAt(s.map, x, y).walkable &&
  !entityAt(s, x, y) &&
  !creatureAt(s, x, y) &&
  !(s.player.x === x && s.player.y === y);

const distance = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

function spawnCreatures(mapId) {
  return MAPS[mapId].spawns.map((spawn) => ({
    type: spawn.type,
    x: spawn.x,
    y: spawn.y,
    hp: CREATURES[spawn.type].hp,
    spawn: { x: spawn.x, y: spawn.y },
    respawnAt: null,
  }));
}

// saved: migrierter Spielstand aus save.js oder null für ein neues Spiel.
// Kreaturen werden nie gespeichert, sonst könnten sie nach einem Update in neuem Gelände stecken.
export function createGame({ saved = null, seed = Date.now() } = {}) {
  const s = {
    seed: seed | 0,
    map: START.map,
    player: {
      x: START.x, y: START.y, hp: PLAYER.maxHp, maxHp: PLAYER.maxHp, atk: PLAYER.atk, weapon: null,
    },
    turn: 0,
    flags: {},
    stats: { kills: 0, faints: 0 },
    lastSeenDay: null,
    log: [],
    creatures: [],
  };
  if (saved) {
    if (MAPS[saved.map]) s.map = saved.map;
    Object.assign(s.player, saved.player);
    s.turn = saved.turn ?? 0;
    s.flags = saved.flags ?? {};
    s.stats = { ...s.stats, ...saved.stats };
    s.lastSeenDay = saved.lastSeenDay ?? null;
    s.player.hp = Math.min(Math.max(s.player.hp, 1), s.player.maxHp);
  }
  s.creatures = spawnCreatures(s.map);
  // Die Welt kann sich über Nacht geändert haben: Spieler notfalls zurück an den Start setzen.
  if (!isStandable(s, s.player.x, s.player.y)) {
    s.map = START.map;
    s.player.x = START.x;
    s.player.y = START.y;
    s.creatures = spawnCreatures(s.map);
  }
  s.creatures = s.creatures.filter((c) => !(c.x === s.player.x && c.y === s.player.y));
  return s;
}

const isStandable = (s, x, y) => tileAt(s.map, x, y).walkable && !entityAt(s, x, y);

// Was beim Dagegenlaufen an einem Objekt passiert. Neue Objektarten bekommen hier einen Eintrag.
export const INTERACTIONS = {
  npc(s, e) {
    const remark = e.itemLines?.[s.player.weapon];
    const heard = (s.flags.heard ??= {});
    if (remark && !heard[`${e.id}:${s.player.weapon}`]) {
      heard[`${e.id}:${s.player.weapon}`] = true;
      log(s, `${e.name}: "${remark}"`);
      return;
    }
    const talk = (s.flags.talk ??= {});
    const line = talk[e.id] ?? 0;
    log(s, `${e.name}: "${e.lines[line % e.lines.length]}"`);
    talk[e.id] = line + 1;
  },
  sign(s, e) {
    log(s, e.text);
  },
  pickup(s, e) {
    const item = ITEMS[e.item];
    (s.flags.taken ??= {})[e.id] = true;
    s.player.weapon = e.item;
    log(s, e.text, 'new-tonight');
    log(s, `You now ${item.hitVerb} things for ${attackOf(s)} damage.`);
  },
  well(s, e) {
    s.player.hp = s.player.maxHp;
    log(s, e.text);
  },
};

function attackCreature(s, c) {
  const def = CREATURES[c.type];
  const weapon = ITEMS[s.player.weapon];
  c.hp -= attackOf(s);
  if (c.hp <= 0) {
    c.respawnAt = s.turn + def.respawnTurns;
    s.stats.kills += 1;
    log(s, weapon ? `You ${weapon.hitVerb} the ${def.name}. It leaves.` : `You squash the ${def.name}.`);
  } else {
    log(s, weapon ? `You ${weapon.hitVerb} the ${def.name}.` : `You hit the ${def.name}.`);
  }
}

function hurtPlayer(s, def) {
  s.player.hp -= def.atk;
  log(s, `The ${def.name} bites you.`, 'danger');
  if (s.player.hp <= 0) {
    s.stats.faints += 1;
    s.map = START.map;
    s.player.x = START.x;
    s.player.y = START.y;
    s.player.hp = s.player.maxHp;
    s.creatures = spawnCreatures(s.map).filter(
      (c) => !(c.x === s.player.x && c.y === s.player.y),
    );
    log(s, 'Everything goes dark. You wake up in your bed, as if it were a new day.', 'danger');
    return true;
  }
  return false;
}

function stepCreature(s, c, dx, dy) {
  if (isFree(s, c.x + dx, c.y + dy)) {
    c.x += dx;
    c.y += dy;
    return true;
  }
  return false;
}

function wander(s, c) {
  if (random(s) < 0.5) return;
  const [dx, dy] = Object.values(DIRS)[Math.floor(random(s) * 4)];
  stepCreature(s, c, dx, dy);
}

// Verhalten pro Runde. Rückgabe true heißt: Der Spieler wurde besiegt, die Runde endet sofort.
export const AI_BEHAVIOURS = {
  skulk(s, c, def) {
    const d = distance(c, s.player);
    if (d === 1) {
      return random(s) < def.hitChance ? hurtPlayer(s, def) : false;
    }
    if (d > def.senseRange) {
      wander(s, c);
      return false;
    }
    const dx = Math.sign(s.player.x - c.x);
    const dy = Math.sign(s.player.y - c.y);
    const horizontalFirst = Math.abs(s.player.x - c.x) >= Math.abs(s.player.y - c.y);
    const moved = horizontalFirst
      ? (dx && stepCreature(s, c, dx, 0)) || (dy && stepCreature(s, c, 0, dy))
      : (dy && stepCreature(s, c, 0, dy)) || (dx && stepCreature(s, c, dx, 0));
    if (!moved) wander(s, c);
    return false;
  },
};

function endTurn(s) {
  s.turn += 1;
  for (const c of s.creatures) {
    if (c.respawnAt === null) continue;
    if (s.turn >= c.respawnAt && distance(c.spawn, s.player) > 5 && isFree(s, c.spawn.x, c.spawn.y)) {
      c.x = c.spawn.x;
      c.y = c.spawn.y;
      c.hp = CREATURES[c.type].hp;
      c.respawnAt = null;
    }
  }
  for (const c of s.creatures) {
    if (c.respawnAt !== null) continue;
    const def = CREATURES[c.type];
    if (AI_BEHAVIOURS[def.ai](s, c, def)) return;
  }
}

// Einziger Einstiegspunkt für Spielzüge. Rückgabe: true, wenn eine Runde vergangen ist.
export function act(s, action) {
  if (action === 'wait') {
    endTurn(s);
    return true;
  }
  const dir = DIRS[action];
  if (!dir) return false;
  const x = s.player.x + dir[0];
  const y = s.player.y + dir[1];

  const creature = creatureAt(s, x, y);
  if (creature) {
    attackCreature(s, creature);
    endTurn(s);
    return true;
  }
  const entity = entityAt(s, x, y);
  if (entity) {
    INTERACTIONS[entity.kind](s, entity);
    endTurn(s);
    return true;
  }
  const tile = tileAt(s.map, x, y);
  if (!tile.walkable) {
    if (tile.bump) log(s, tile.bump);
    return false;
  }
  s.player.x = x;
  s.player.y = y;
  endTurn(s);
  return true;
}
