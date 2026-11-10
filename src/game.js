// Reine Spiellogik ohne DOM. Alles Spielbare läuft über act(), damit die Tests es direkt prüfen können.
// Seit der Aufräumnacht 7 in Module geteilt; dieses Modul gibt alles weiter, Importe von außen bleiben gleich.
import { MAPS, PLAYER, START } from '../content/world.js';
import { CREATURES } from '../content/creatures.js';
import { ITEMS } from '../content/items.js';
import { LEVELS } from '../content/levels.js';
import { WHEEL } from '../content/wheel.js';
import { QUESTS } from '../content/quests.js';
import { SHOPS } from '../content/shops.js';
import { SKILLS } from '../content/skills.js';
import { DIRS, activeEvent, currentDay, distance, entityAt, log, mitigate, random, tileAt } from './core.js';
import {
  ARMOR_SLOTS, countItem, describeGain, gainXp, giveItem, hasItem, isWeapon, skillPoints, takeItem, attackOf, useItem,
} from './inventory.js';
import {
  AI_BEHAVIOURS, creatureAt, creatureTurn, enterMap, isFree, newCreature, spawnCreatures, sweepMarks,
} from './creatures.js';
import { castSpell, spellById } from './spells.js';
import { mineVein, useBench } from './trades.js';

export * from './core.js';
export * from './inventory.js';
export * from './creatures.js';
export * from './shared.js';
export * from './spells.js';
export * from './trades.js';

// saved: migrierter Spielstand aus save.js oder null für ein neues Spiel.
// Kreaturen werden nie gespeichert, sonst könnten sie nach einem Update in neuem Gelände stecken.
export function createGame({ saved = null, seed = Date.now() } = {}) {
  const s = {
    seed: seed | 0,
    map: START.map,
    player: {
      x: START.x, y: START.y, hp: PLAYER.maxHp, maxHp: PLAYER.maxHp, atk: PLAYER.atk, weapon: null, bag: [], xp: 0, level: 1,
      armor: { head: null, body: null, feet: null }, skills: {}, ward: 0, mining: 0,
    },
    turn: 0,
    flags: {},
    stats: { kills: 0, faints: 0, xp: 0, together: 0, ink: 0, spells: 0, crows: 0, ore: 0, mites: 0 },
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
    // Zähler, die erst später dazukamen (together seit Tag 6, ink/spells/crows seit Tag 7), beginnen bei 0.
    // ore und mites seit Tag 8.
    for (const stat of ['together', 'ink', 'spells', 'crows', 'ore', 'mites']) if (!Number.isInteger(s.stats[stat])) s.stats[stat] = 0;
    // Bergbau (seit Tag 8): Zahl der Schläge, fehlt sie oder ist ungültig, gilt 0.
    if (!Number.isInteger(s.player.mining) || s.player.mining < 0) s.player.mining = 0;
    // Tintenring (WARD, seit Tag 7): höchstens so viele Ladungen, wie der Zauber gibt.
    if (!Number.isInteger(s.player.ward) || s.player.ward < 0) s.player.ward = 0;
    s.player.ward = Math.min(s.player.ward, spellById('ward').charges);
    // Stände von vor Tag 6 haben keine Knacks: Die Punkte ihrer Stufen warten dann im Fenster [ CHARA ].
    const skills = saved.player?.skills ?? {};
    s.player.skills = Object.fromEntries(SKILLS
      .map((k) => [k.id, Math.min(k.max, Number.isInteger(skills[k.id]) && skills[k.id] > 0 ? skills[k.id] : 0)])
      .filter(([, rank]) => rank > 0));
    if (skillPoints(s) < 0) s.player.skills = {};
    if (!Number.isInteger(s.player.maxHp) || s.player.maxHp < 1) s.player.maxHp = PLAYER.maxHp;
    s.player.hp = Number.isInteger(s.player.hp) ? Math.min(Math.max(s.player.hp, 1), s.player.maxHp) : s.player.maxHp;
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
    // Einmaliges Geschenk einer Figur (seit Tag 6), zum Beispiel als Dank für ein erreichtes Event.
    if (e.gift && !s.flags.gifts?.[e.id]) {
      (s.flags.gifts ??= {})[e.id] = true;
      log(s, `${e.name}: "${e.gift.text}"`, 'new-tonight');
      if (e.gift.item) {
        giveItem(s, e.gift.item);
        log(s, `You receive: ${ITEMS[e.gift.item].name}.`);
        describeGain(s, e.gift.item);
      }
      if (e.gift.xp) gainXp(s, e.gift.xp);
      return;
    }
    const quest = QUESTS.find((q) => q.giver === e.id && questOpen(s, q));
    if (quest && talkQuest(s, e, quest)) return;
    // Einmalige Bemerkung zu etwas, das man dabeihat: zuerst zur Waffe in der Hand, dann zu allem anderen
    // (vor Tag 7 nur zur Waffe, deshalb blieben Bemerkungen zu Rüstung oder Büchern stumm).
    const heard = (s.flags.heard ??= {});
    const lines = e.itemLines ?? {};
    const noticed = [s.player.weapon, ...Object.keys(lines)]
      .find((id) => lines[id] && hasItem(s, id) && !heard[`${e.id}:${id}`]);
    if (noticed) {
      heard[`${e.id}:${noticed}`] = true;
      log(s, `${e.name}: "${lines[noticed]}"`);
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
  // Läden (Tag 6): Der Browser öffnet danach das Fenster [ SHOP ] (s.openShop, wird nicht gespeichert).
  shop(s, e) {
    s.openShop = e.shop;
    log(s, SHOPS[e.shop].openText);
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
  // Werkbank: öffnet im Browser das Fenster [ WORKBENCH ] (seit Tag 8, vorher baute sie das erste passende Rezept).
  bench(s, e) {
    useBench(s, e);
  },
  // Erzadern (seit Tag 8): mit der Spitzhacke Erz schlagen, zwei Schläge pro Ader und Nacht (src/trades.js).
  vein(s, e) {
    mineVein(s, e);
  },
  // Tintenfass (Tag 7): gibt jede Nacht amount Tropfen Tinte (flags.inkDay[id]).
  inkwell(s, e) {
    const days = (s.flags.inkDay ??= {});
    if (days[e.id] === currentDay()) {
      log(s, e.dryText);
      return;
    }
    days[e.id] = currentDay();
    for (let i = 0; i < e.amount; i += 1) giveItem(s, 'ink');
    log(s, e.text, 'new-tonight');
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

// Fortschritt: bei Sammelquests die Zahl der Dinge, bei stat-Quests der Zuwachs seit dem Annehmen.
export function questProgress(s, quest) {
  if (quest.stat) return Math.max(0, (s.stats[quest.stat] ?? 0) - (s.flags.questBase?.[quest.id] ?? 0));
  return countItem(s, quest.item);
}

// Kann die Quest gerade angeboten oder abgeschlossen werden? Tägliche Quests gibt es jede Nacht neu,
// after verlangt, dass eine andere Quest schon erledigt ist.
function questOpen(s, quest) {
  if (quest.after && questState(s, quest.after) !== 'done') return false;
  if (questState(s, quest.id) !== 'done') return true;
  return quest.repeat === 'daily' && s.flags.questDay?.[quest.id] !== currentDay();
}

// Das Gespräch über eine Quest. Rückgabe false: Die Figur hat dazu gerade nichts zu sagen.
function talkQuest(s, e, quest) {
  const quests = (s.flags.quests ??= {});
  if (quests[quest.id] !== 'active') {
    if (quest.startItem && !hasItem(s, quest.startItem)) return false;
    quests[quest.id] = 'active';
    if (quest.stat) (s.flags.questBase ??= {})[quest.id] = s.stats[quest.stat] ?? 0;
    log(s, `${e.name}: "${quest.offerText}"`, 'new-tonight');
    return true;
  }
  if (questProgress(s, quest) >= quest.count) {
    if (!quest.stat) for (let i = 0; i < quest.count; i += 1) takeItem(s, quest.item);
    quests[quest.id] = 'done';
    if (quest.repeat) (s.flags.questDay ??= {})[quest.id] = currentDay();
    log(s, `${e.name}: "${quest.doneText}"`, 'new-tonight');
    const { item, count = 1, xp } = quest.reward;
    if (item) {
      for (let i = 0; i < count; i += 1) giveItem(s, item);
      log(s, `You receive: ${ITEMS[item].name}${count > 1 ? ` x${count}` : ''}.`);
      describeGain(s, item);
    }
    if (xp) gainXp(s, xp);
    return true;
  }
  // Abwechselnd erinnern und plaudern, damit die Figur ihre anderen Sätze nicht vergisst.
  const nag = (s.flags.questNag ??= {});
  nag[quest.id] = !nag[quest.id];
  if (!nag[quest.id]) return false;
  log(s, `${e.name}: "${quest.remindText}" (${questProgress(s, quest)}/${quest.count})`);
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

// Schaden eines Schlags: Angriff minus Panzer der Kreatur (def, seit Tag 7), höchstens die Hälfte abgefangen.
export const damageTo = (s, type) => mitigate(attackOf(s), CREATURES[type]?.def ?? 0);

function attackCreature(s, c) {
  const def = CREATURES[c.type];
  const weapon = ITEMS[s.player.weapon];
  const dmg = damageTo(s, c.type);
  // Gemeinsame Welt: Der Server zieht die HP ab und meldet den Sieg allen, die mitgekämpft haben.
  if (s.shared) {
    s.outbox.push({ t: 'hit', id: c.id, dmg });
    c.hp -= dmg;
    log(s, weapon ? `You ${weapon.hitVerb} the ${def.name}.` : `You hit the ${def.name}.`);
    return;
  }
  c.hp -= dmg;
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
  if (def.stat) s.stats[def.stat] = (s.stats[def.stat] ?? 0) + 1;
  log(s, text);
  if (def.boss) log(s, def.defeatText ?? `The ${def.name} is gone for good.`, 'new-tonight');
  for (const drop of def.drops ?? []) {
    if (random(s) >= drop.chance) continue;
    giveItem(s, drop.item);
    log(s, `The ${def.name} leaves a ${ITEMS[drop.item].name} behind.`);
    describeGain(s, drop.item);
  }
  gainXp(s, def.xp ?? 0);
}


function endTurn(s) {
  s.turn += 1;
  // In der gemeinsamen Welt bewegt der Server die Kreaturen im Takt, nicht der eigene Zug.
  if (s.shared) return;
  sweepMarks(s.creatures);
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
    if (creatureTurn(s, c, def)) return;
  }
}

// Einziger Einstiegspunkt für Spielzüge. Rückgabe: true, wenn eine Runde vergangen ist.
export function act(s, action) {
  if (action === 'wait') {
    endTurn(s);
    return true;
  }
  // Trinken (seit dem Rebalance): 'use:<id>' kostet eine Runde, wie ein Schlag. Sonst heilt man sich mitten im Kampf umsonst.
  if (typeof action === 'string' && action.startsWith('use:')) {
    if (!useItem(s, action.slice('use:'.length))) return false;
    endTurn(s);
    return true;
  }
  // Zauber (seit Tag 7): 'cast:ward', 'cast:mend', 'cast:hop:<Richtung>'.
  if (typeof action === 'string' && action.startsWith('cast:')) {
    const [, id, dirName] = action.split(':');
    if (!castSpell(s, id, dirName)) return false;
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
  // Einbahnfelder (oneWay) lassen sich nur in ihrer Richtung betreten.
  if (!tile.walkable && tile.oneWay !== action) {
    if (tile.bump) log(s, tile.bump);
    return false;
  }
  s.player.x = x;
  s.player.y = y;
  endTurn(s);
  return true;
}
