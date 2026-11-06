// Reine Spiellogik ohne DOM. Alles Spielbare läuft über act(), damit die Tests es direkt prüfen können.
import { MAPS, PLAYER, START } from '../content/world.js';
import { TILES } from '../content/tiles.js';
import { CREATURES } from '../content/creatures.js';
import { CHRONICLE } from '../content/chronicle.js';
import { ITEMS } from '../content/items.js';
import { RECIPES } from '../content/recipes.js';
import { LEVELS, LEVEL_UP_TEXT } from '../content/levels.js';
import { WHEEL } from '../content/wheel.js';
import { EVENT } from '../content/event.js';

const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const LOG_LIMIT = 50;

export const currentDay = () => CHRONICLE[CHRONICLE.length - 1].day;

// Das laufende Community-Event oder null.
export const activeEvent = (day = currentDay()) =>
  (EVENT && day >= EVENT.startDay && day <= EVENT.endDay ? EVENT : null);

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
// Gegenstände: Waffen (mit atk) liegen in player.weapon, alles andere in player.bag.
export const hasItem = (s, id) => s.player.weapon === id || s.player.bag.includes(id);
function takeItem(s, id) {
  if (s.player.weapon === id) s.player.weapon = null;
  else s.player.bag.splice(s.player.bag.indexOf(id), 1);
}
// Eine neue Waffe ersetzt die alte, die alte wandert in den Beutel und geht nie verloren.
function giveItem(s, id) {
  if (ITEMS[id].atk === undefined) {
    s.player.bag.push(id);
    return;
  }
  if (s.player.weapon) s.player.bag.push(s.player.weapon);
  s.player.weapon = id;
}

// Stufen (seit Tag 4): Erfahrung aus Siegen und vom Glücksrad. Nächste Schwelle oder null am Ende der Leiter.
export const nextLevelXp = (s) => LEVELS[s.player.level]?.xp ?? null;

function gainXp(s, amount) {
  s.player.xp += amount;
  s.stats.xp += amount;
  while (nextLevelXp(s) !== null && s.player.xp >= nextLevelXp(s)) {
    const step = LEVELS[s.player.level];
    s.player.level += 1;
    s.player.maxHp += step.maxHp ?? 0;
    s.player.atk += step.atk ?? 0;
    s.player.hp = s.player.maxHp;
    log(s, LEVEL_UP_TEXT.replace('{level}', s.player.level), 'new-tonight');
    const gains = [step.maxHp && `+${step.maxHp} max HP`, step.atk && `+${step.atk} attack`].filter(Boolean);
    if (gains.length) log(s, `${gains.join(', ')}. You are fully mended.`);
  }
}

export const creatureAt = (s, x, y) =>
  s.creatures.find((c) => c.respawnAt === null && c.x === x && c.y === y);

const isFree = (s, x, y) =>
  tileAt(s.map, x, y).walkable &&
  !entityAt(s, x, y) &&
  !creatureAt(s, x, y) &&
  !(s.player.x === x && s.player.y === y);

const distance = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

// once: Kreatur kommt nach dem Sieg nicht wieder (Besucher vom Glücksrad).
const newCreature = (type, x, y, once = false) => ({
  type, x, y, hp: CREATURES[type].hp, spawn: { x, y }, respawnAt: null, once,
});

function spawnCreatures(mapId) {
  return MAPS[mapId].spawns.map((spawn) => newCreature(spawn.type, spawn.x, spawn.y));
}

// Wechselt die Karte. Kreaturen der neuen Karte erscheinen frisch, nie auf dem Ankunftsfeld.
function enterMap(s, mapId, x, y) {
  s.map = mapId;
  s.player.x = x;
  s.player.y = y;
  s.creatures = spawnCreatures(mapId).filter((c) => !(c.x === x && c.y === y));
}

// saved: migrierter Spielstand aus save.js oder null für ein neues Spiel.
// Kreaturen werden nie gespeichert, sonst könnten sie nach einem Update in neuem Gelände stecken.
export function createGame({ saved = null, seed = Date.now() } = {}) {
  const s = {
    seed: seed | 0,
    map: START.map,
    player: {
      x: START.x, y: START.y, hp: PLAYER.maxHp, maxHp: PLAYER.maxHp, atk: PLAYER.atk, weapon: null, bag: [], xp: 0, level: 1,
    },
    turn: 0,
    flags: {},
    stats: { kills: 0, faints: 0, xp: 0 },
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
    if (!Array.isArray(s.player.bag)) s.player.bag = [];
    s.player.bag = s.player.bag.filter((id) => ITEMS[id]);
    // Stände von vor Tag 4 haben keine Stufe: Sie beginnen bei Stufe 1 ohne Erfahrung.
    if (!Number.isInteger(s.player.xp) || s.player.xp < 0) s.player.xp = 0;
    if (!Number.isInteger(s.player.level) || !LEVELS[s.player.level - 1]) s.player.level = 1;
    if (!Number.isInteger(s.stats.xp)) s.stats.xp = 0;
    s.player.hp = Math.min(Math.max(s.player.hp, 1), s.player.maxHp);
  }
  s.creatures = spawnCreatures(s.map);
  // Die Welt kann sich über Nacht geändert haben: Spieler notfalls zurück an den Start setzen.
  if (!isStandable(s, s.player.x, s.player.y)) enterMap(s, START.map, START.x, START.y);
  s.creatures = s.creatures.filter((c) => !(c.x === s.player.x && c.y === s.player.y));
  return s;
}

const isStandable = (s, x, y) => tileAt(s.map, x, y).walkable && !entityAt(s, x, y);

// Was beim Dagegenlaufen an einem Objekt passiert. Neue Objektarten bekommen hier einen Eintrag.
export const INTERACTIONS = {
  npc(s, e) {
    // Wer ein Event leitet, erklärt es beim ersten Gespräch. Erst danach zeigt die Anzeige die Aufgabe.
    const event = activeEvent();
    if (event?.giver === e.id && !s.flags.eventsHeard?.[event.id]) {
      (s.flags.eventsHeard ??= {})[event.id] = true;
      log(s, `${e.name}: "${event.intro}"`, 'new-tonight');
      return;
    }
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
    giveItem(s, e.item);
    log(s, e.text, 'new-tonight');
    if (item.atk !== undefined) log(s, `You now ${item.hitVerb} things for ${attackOf(s)} damage.`);
  },
  // Werkbank: baut das erste Rezept aus content/recipes.js, für das der Spieler alles dabeihat.
  bench(s, e) {
    const recipe = RECIPES.find((r) => r.needs.every((id) => hasItem(s, id)));
    if (!recipe) {
      const partial = RECIPES.find((r) => r.needs.some((id) => hasItem(s, id)));
      log(s, partial ? partial.hint : e.text);
      return;
    }
    for (const id of recipe.needs) takeItem(s, id);
    giveItem(s, recipe.makes);
    const made = ITEMS[recipe.makes];
    log(s, recipe.text, 'new-tonight');
    if (made.atk !== undefined) log(s, `You now ${made.hitVerb} things for ${attackOf(s)} damage.`);
  },
  // Türen führen auf eine andere Karte: to = { map, x, y } ist das Ankunftsfeld.
  door(s, e) {
    enterMap(s, e.to.map, e.to.x, e.to.y);
    log(s, e.text);
  },
  // Glücksrad (Tag 4): einmal pro Nacht umsonst, danach für einen Knopf.
  wheel(s) {
    const flags = s.flags;
    if (flags.wheelDay !== currentDay()) {
      flags.wheelDay = currentDay();
      log(s, WHEEL.freeText);
    } else if (hasItem(s, WHEEL.cost)) {
      takeItem(s, WHEEL.cost);
      log(s, WHEEL.paidText);
    } else {
      log(s, WHEEL.emptyText);
      return;
    }
    flags.spins = (flags.spins ?? 0) + 1;
    spinWheel(s);
  },
  well(s, e) {
    s.player.hp = s.player.maxHp;
    log(s, e.text);
  },
};

function pickWedge(s) {
  const total = WHEEL.wedges.reduce((sum, w) => sum + w.weight, 0);
  let roll = random(s) * total;
  return WHEEL.wedges.find((w) => (roll -= w.weight) < 0) ?? WHEEL.wedges.at(-1);
}

// Was ein Feld des Glücksrads bewirkt. Neue Effekte bekommen hier einen Eintrag.
export const WHEEL_EFFECTS = {
  xp(s, w) { gainXp(s, w.amount); },
  heal(s) { s.player.hp = s.player.maxHp; },
  item(s, w) { giveItem(s, w.item); },
  nothing() {},
  maxHp(s, w) {
    s.player.maxHp += w.amount;
    s.player.hp += w.amount;
  },
  visitor(s, w) {
    const spot = Object.values(DIRS)
      .map(([dx, dy]) => ({ x: s.player.x + dx, y: s.player.y + dy }))
      .find(({ x, y }) => isFree(s, x, y));
    if (spot) s.creatures.push(newCreature(w.creature, spot.x, spot.y, true));
  },
};

function spinWheel(s) {
  let wedge = pickWedge(s);
  // Einzelstücke gibt es nur einmal. Wer es schon hat, bekommt stattdessen das erste Erfahrungsfeld.
  if (wedge.unique && hasItem(s, wedge.item)) wedge = WHEEL.wedges.find((w) => w.effect === 'xp');
  log(s, wedge.text, 'new-tonight');
  WHEEL_EFFECTS[wedge.effect](s, wedge);
}

function attackCreature(s, c) {
  const def = CREATURES[c.type];
  const weapon = ITEMS[s.player.weapon];
  c.hp -= attackOf(s);
  if (c.hp <= 0) {
    c.respawnAt = s.turn + def.respawnTurns;
    if (c.once) s.creatures.splice(s.creatures.indexOf(c), 1);
    s.stats.kills += 1;
    log(s, weapon ? `You ${weapon.hitVerb} the ${def.name}. It leaves.` : `You squash the ${def.name}.`);
    if (def.drop && random(s) < def.drop.chance) {
      giveItem(s, def.drop.item);
      log(s, `The ${def.name} leaves a ${ITEMS[def.drop.item].name} behind.`);
    }
    gainXp(s, def.xp ?? 0);
  } else {
    log(s, weapon ? `You ${weapon.hitVerb} the ${def.name}.` : `You hit the ${def.name}.`);
  }
}

function hurtPlayer(s, def) {
  s.player.hp -= def.atk;
  log(s, `The ${def.name} ${def.biteVerb ?? 'bites'} you.`, 'danger');
  if (s.player.hp <= 0) {
    s.stats.faints += 1;
    s.player.hp = s.player.maxHp;
    enterMap(s, START.map, START.x, START.y);
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
// Ein Schritt auf den Spieler zu. Rückgabe true, wenn die Kreatur sich bewegt hat.
function approach(s, c) {
  const dx = Math.sign(s.player.x - c.x);
  const dy = Math.sign(s.player.y - c.y);
  const horizontalFirst = Math.abs(s.player.x - c.x) >= Math.abs(s.player.y - c.y);
  return Boolean(horizontalFirst
    ? (dx && stepCreature(s, c, dx, 0)) || (dy && stepCreature(s, c, 0, dy))
    : (dy && stepCreature(s, c, 0, dy)) || (dx && stepCreature(s, c, dx, 0)));
}

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
    if (!approach(s, c)) wander(s, c);
    return false;
  },
  // Frösche (Tag 4): beißen wie Ratten, sitzen aber jede zweite Runde still und springen dann zwei Felder.
  hop(s, c, def) {
    if (distance(c, s.player) === 1) {
      return random(s) < def.hitChance ? hurtPlayer(s, def) : false;
    }
    if (s.turn % 2 === 1) return false;
    if (distance(c, s.player) > def.senseRange) {
      wander(s, c);
      return false;
    }
    if (approach(s, c) && distance(c, s.player) > 1) approach(s, c);
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
