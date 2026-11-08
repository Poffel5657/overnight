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
import { QUESTS } from '../content/quests.js';

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
// Rüstung (seit Tag 5): player.armor = { head, body, feet }, def wird vom Schaden abgezogen.
export const ARMOR_SLOTS = ['head', 'body', 'feet'];
export const defenseOf = (s) =>
  Object.values(s.player.armor).reduce((sum, id) => sum + (ITEMS[id]?.def ?? 0), 0);
const isWeapon = (id) => ITEMS[id]?.atk !== undefined;
const isArmor = (id) => Boolean(ITEMS[id]?.slot);

// Gegenstände: Waffen (mit atk) liegen in player.weapon, Rüstung in player.armor, alles andere in player.bag.
const worn = (s) => [s.player.weapon, ...Object.values(s.player.armor)].filter(Boolean);
export const countItem = (s, id) =>
  worn(s).filter((w) => w === id).length + s.player.bag.filter((b) => b === id).length;
export const hasItem = (s, id) => countItem(s, id) > 0;
// Aus dem Beutel zuerst, damit niemand ungefragt seine Waffe oder Rüstung verliert.
function takeItem(s, id) {
  const index = s.player.bag.indexOf(id);
  if (index >= 0) s.player.bag.splice(index, 1);
  else if (s.player.weapon === id) s.player.weapon = null;
  else s.player.armor[ITEMS[id].slot] = null;
}
// Eine neue Waffe ersetzt die alte, die alte wandert in den Beutel und geht nie verloren.
// Rüstung zieht man an, wenn der Platz frei ist, sonst kommt sie in den Beutel.
function giveItem(s, id) {
  const item = ITEMS[id];
  if (isWeapon(id)) {
    if (s.player.weapon) s.player.bag.push(s.player.weapon);
    s.player.weapon = id;
  } else if (isArmor(id) && !s.player.armor[item.slot]) {
    s.player.armor[item.slot] = id;
  } else {
    s.player.bag.push(id);
  }
}

// Fenster [ GEAR ]: Waffe oder Rüstung aus dem Beutel anlegen. Kostet keine Runde.
// Das bisher Getragene wandert in den Beutel. Rückgabe true, wenn sich etwas geändert hat.
export function equip(s, id) {
  const index = s.player.bag.indexOf(id);
  if (index < 0 || !(isWeapon(id) || isArmor(id))) return false;
  s.player.bag.splice(index, 1);
  const item = ITEMS[id];
  if (isWeapon(id)) {
    if (s.player.weapon) s.player.bag.push(s.player.weapon);
    s.player.weapon = id;
    log(s, `You take up the ${item.name}. You now ${item.hitVerb} things for ${attackOf(s)} damage.`);
  } else {
    const old = s.player.armor[item.slot];
    if (old) s.player.bag.push(old);
    s.player.armor[item.slot] = id;
    log(s, `You put on the ${item.name}. Defence ${defenseOf(s)}.`);
  }
  return true;
}

// Ergebnis einer neuen Sache für das Log: Waffen nennen den Schaden, Rüstung die Abwehr.
function describeGain(s, id) {
  const item = ITEMS[id];
  if (isWeapon(id) && s.player.weapon === id) log(s, `You now ${item.hitVerb} things for ${attackOf(s)} damage.`);
  else if (isArmor(id) && s.player.armor[item.slot] === id) log(s, `You wear the ${item.name}. Defence ${defenseOf(s)}.`);
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

// s.others: andere Spieler in der gemeinsamen Welt (nur auf dem Server gesetzt), auf deren Feld nichts tritt.
const isFree = (s, x, y) =>
  tileAt(s.map, x, y).walkable &&
  !entityAt(s, x, y) &&
  !creatureAt(s, x, y) &&
  !(s.player.x === x && s.player.y === y) &&
  !s.others?.some((p) => p.x === x && p.y === y);

const distance = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

// once: Kreatur kommt nach dem Sieg nicht wieder (Besucher vom Glücksrad).
const newCreature = (type, x, y, once = false) => ({
  type, x, y, hp: CREATURES[type].hp, spawn: { x, y }, respawnAt: null, once,
});

// Besiegte Bosse (flags.slain) kommen nie wieder.
function spawnCreatures(s, mapId) {
  return MAPS[mapId].spawns
    .filter((spawn) => !(CREATURES[spawn.type].boss && s.flags.slain?.[spawn.type]))
    .map((spawn) => newCreature(spawn.type, spawn.x, spawn.y));
}

// Wechselt die Karte. Kreaturen der neuen Karte erscheinen frisch, nie auf dem Ankunftsfeld.
// In der gemeinsamen Welt schickt der Server die Kreaturen der neuen Karte; bis dahin ist sie leer.
function enterMap(s, mapId, x, y) {
  s.map = mapId;
  s.player.x = x;
  s.player.y = y;
  s.creatures = s.shared ? [] : spawnCreatures(s, mapId).filter((c) => !(c.x === x && c.y === y));
  s.worldMap = null;
}

// saved: migrierter Spielstand aus save.js oder null für ein neues Spiel.
// Kreaturen werden nie gespeichert, sonst könnten sie nach einem Update in neuem Gelände stecken.
export function createGame({ saved = null, seed = Date.now() } = {}) {
  const s = {
    seed: seed | 0,
    map: START.map,
    player: {
      x: START.x, y: START.y, hp: PLAYER.maxHp, maxHp: PLAYER.maxHp, atk: PLAYER.atk, weapon: null, bag: [], xp: 0, level: 1,
      armor: { head: null, body: null, feet: null },
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
    // Stände von vor Tag 5 haben keine Rüstung. Unbekanntes oder Falsches wird verworfen.
    const armor = saved.player?.armor ?? {};
    s.player.armor = Object.fromEntries(ARMOR_SLOTS.map((slot) =>
      [slot, ITEMS[armor[slot]]?.slot === slot ? armor[slot] : null]));
    if (s.player.weapon && !isWeapon(s.player.weapon)) s.player.weapon = null;
    // Stände von vor Tag 4 haben keine Stufe: Sie beginnen bei Stufe 1 ohne Erfahrung.
    if (!Number.isInteger(s.player.xp) || s.player.xp < 0) s.player.xp = 0;
    if (!Number.isInteger(s.player.level) || !LEVELS[s.player.level - 1]) s.player.level = 1;
    if (!Number.isInteger(s.stats.xp)) s.stats.xp = 0;
    s.player.hp = Math.min(Math.max(s.player.hp, 1), s.player.maxHp);
  }
  s.creatures = spawnCreatures(s, s.map);
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
    const quest = QUESTS.find((q) => q.giver === e.id && questState(s, q.id) !== 'done');
    if (quest && talkQuest(s, e, quest)) return;
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
    (s.flags.taken ??= {})[e.id] = true;
    giveItem(s, e.item);
    log(s, e.text, 'new-tonight');
    describeGain(s, e.item);
  },
  // Truhen (Tag 5): geben einmal ihren Inhalt und bleiben offen stehen (flags.opened).
  chest(s, e) {
    const opened = (s.flags.opened ??= {});
    if (opened[e.id]) {
      log(s, e.emptyText);
      return;
    }
    opened[e.id] = true;
    giveItem(s, e.item);
    log(s, e.text, 'new-tonight');
    describeGain(s, e.item);
  },
  // Verschlossene Gitter (Tag 5): Mit dem Schlüssel (key) gehen sie für immer auf und verschwinden wie aufgehobene Dinge.
  gate(s, e) {
    if (!hasItem(s, e.key)) {
      log(s, e.text);
      return;
    }
    takeItem(s, e.key);
    (s.flags.taken ??= {})[e.id] = true;
    log(s, e.openText, 'new-tonight');
  },
  // Werkbank: baut das erste Rezept aus content/recipes.js, für das der Spieler alles dabeihat.
  bench(s, e) {
    const recipe = RECIPES.find((r) => r.needs.every((id) => countItem(s, id) >= r.needs.filter((n) => n === id).length));
    if (!recipe) {
      const partial = RECIPES.find((r) => r.needs.some((id) => hasItem(s, id)));
      log(s, partial ? partial.hint : e.text);
      return;
    }
    for (const id of recipe.needs) takeItem(s, id);
    giveItem(s, recipe.makes);
    log(s, recipe.text, 'new-tonight');
    describeGain(s, recipe.makes);
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
  // Der Brunnen heilt. Wer schon heil ist und trotzdem trinkt, rutscht hinein (down, seit Tag 5).
  well(s, e) {
    if (s.player.hp >= s.player.maxHp && e.down) {
      enterMap(s, e.down.map, e.down.x, e.down.y);
      log(s, e.downText, 'new-tonight');
      return;
    }
    s.player.hp = s.player.maxHp;
    log(s, e.text);
  },
};

// Quests (seit Tag 5, Daten in content/quests.js).
export const questState = (s, id) => s.flags.quests?.[id] ?? null;

// Das Gespräch über eine Quest. Rückgabe false: Die Figur hat dazu gerade nichts zu sagen.
function talkQuest(s, e, quest) {
  const quests = (s.flags.quests ??= {});
  if (!quests[quest.id]) {
    if (quest.startItem && !hasItem(s, quest.startItem)) return false;
    quests[quest.id] = 'active';
    log(s, `${e.name}: "${quest.offerText}"`, 'new-tonight');
    return true;
  }
  if (countItem(s, quest.item) >= quest.count) {
    for (let i = 0; i < quest.count; i += 1) takeItem(s, quest.item);
    quests[quest.id] = 'done';
    log(s, `${e.name}: "${quest.doneText}"`, 'new-tonight');
    if (quest.reward.item) {
      giveItem(s, quest.reward.item);
      log(s, `You receive: ${ITEMS[quest.reward.item].name}.`);
      describeGain(s, quest.reward.item);
    }
    if (quest.reward.xp) gainXp(s, quest.reward.xp);
    return true;
  }
  // Abwechselnd erinnern und plaudern, damit die Figur ihre anderen Sätze nicht vergisst.
  const nag = (s.flags.questNag ??= {});
  nag[quest.id] = !nag[quest.id];
  if (!nag[quest.id]) return false;
  log(s, `${e.name}: "${quest.remindText}" (${countItem(s, quest.item)}/${quest.count})`);
  return true;
}

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
    if (!spot) return;
    // In der gemeinsamen Welt setzt der Server den Besucher, damit alle ihn sehen.
    if (s.shared) s.outbox.push({ t: 'summon', type: w.creature, x: spot.x, y: spot.y });
    else s.creatures.push(newCreature(w.creature, spot.x, spot.y, true));
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
  // Gemeinsame Welt: Der Server zieht die HP ab und meldet den Sieg allen, die mitgekämpft haben.
  if (s.shared) {
    s.outbox.push({ t: 'hit', id: c.id, dmg: attackOf(s) });
    c.hp -= attackOf(s);
    log(s, weapon ? `You ${weapon.hitVerb} the ${def.name}.` : `You hit the ${def.name}.`);
    return;
  }
  c.hp -= attackOf(s);
  if (c.hp <= 0) {
    c.respawnAt = s.turn + def.respawnTurns;
    if (c.once || def.boss) s.creatures.splice(s.creatures.indexOf(c), 1);
    rewardKill(s, c.type, weapon ? `You ${weapon.hitVerb} the ${def.name}. It leaves.` : `You squash the ${def.name}.`);
  } else {
    log(s, weapon ? `You ${weapon.hitVerb} the ${def.name}.` : `You hit the ${def.name}.`);
  }
}

// Sieg über eine Kreatur: Zähler, Boss-Flag, Beute, Erfahrung. text ist die erste Logzeile.
export function rewardKill(s, type, text) {
  const def = CREATURES[type];
  if (!def) return;
  if (def.boss) (s.flags.slain ??= {})[type] = true;
  s.stats.kills += 1;
  log(s, text);
  if (def.boss) log(s, `The ${def.name} comes apart into ordinary crumbs and washes away.`, 'new-tonight');
  for (const drop of def.drops ?? []) {
    if (random(s) >= drop.chance) continue;
    giveItem(s, drop.item);
    log(s, `The ${def.name} leaves a ${ITEMS[drop.item].name} behind.`);
    describeGain(s, drop.item);
  }
  gainXp(s, def.xp ?? 0);
}

// Rüstung zieht ihre Abwehr vom Schaden ab, ein Punkt geht immer durch.
export const damageFrom = (s, def) => Math.max(1, def.atk - defenseOf(s));

// Auf dem Server (s.onHurt) trifft der Biss einen echten Spieler; sein Browser rechnet den Schaden.
function hurtPlayer(s, def) {
  if (s.onHurt) {
    s.onHurt(def);
    return false;
  }
  s.player.hp -= damageFrom(s, def);
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
  // Aale (Tag 5): rühren sich nie, beißen aber, wer daneben steht.
  lurk(s, c, def) {
    if (distance(c, s.player) !== 1) return false;
    return random(s) < def.hitChance ? hurtPlayer(s, def) : false;
  },
  // Der Krümelhaufen (Tag 5): langsam, ein Schritt jede zweite Runde, aber schwer.
  trudge(s, c, def) {
    if (distance(c, s.player) === 1) {
      return random(s) < def.hitChance ? hurtPlayer(s, def) : false;
    }
    if (s.turn % 2 === 1 || distance(c, s.player) > def.senseRange) return false;
    approach(s, c);
    return false;
  },
};

function endTurn(s) {
  s.turn += 1;
  // In der gemeinsamen Welt bewegt der Server die Kreaturen im Takt, nicht der eigene Zug.
  if (s.shared) return;
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

// ---------------------------------------------------------------------------------------------
// Gemeinsame Welt (seit Tag 6). Der Server (worker/presence.js) führt pro Karte eine Welt mit
// createWorld() und rechnet sie im Takt mit stepWorld(). Dafür nutzt er dieselben AI_BEHAVIOURS:
// Jede Kreatur sieht als s.player den nächsten Spieler, Bisse gehen über s.onHurt an dessen Browser.
// Im Browser setzt applyWorld() die Kreaturen vom Server, takeBite() rechnet einen Biss,
// rewardKill() einen gemeinsamen Sieg. s.shared und s.outbox werden nie gespeichert.

// Nach einem Sieg kommen Bosse in der gemeinsamen Welt nach dieser Zahl Takte wieder, damit Spätere sie auch treffen.
export const WORLD_BOSS_RESPAWN = 900;

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
  const base = { map: world.map, turn: world.turn, seed: world.seed, flags: {}, creatures: world.creatures, others: players };
  for (const c of world.creatures) {
    if (c.respawnAt === null || world.turn < c.respawnAt) continue;
    const view = { ...base, player: { x: -99, y: -99 } };
    if (players.every((p) => distance(c.spawn, p) > 5) && isFree(view, c.spawn.x, c.spawn.y)) {
      Object.assign(c, { x: c.spawn.x, y: c.spawn.y, hp: CREATURES[c.type].hp, respawnAt: null });
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
    AI_BEHAVIOURS[def.ai](view, c, def);
    world.seed = view.seed;
  }
  return bites;
}

// Ein Spieler trifft eine Kreatur. Rückgabe: null (ungültig), { killed: false } oder { killed: true, type, hitters }.
export function hitWorld(world, id, dmg, player) {
  const c = world.creatures.find((x) => x.id === id && x.respawnAt === null);
  if (!c || distance(c, player) !== 1) return null;
  const def = CREATURES[c.type];
  c.hp -= dmg;
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
