// Kreaturen: Setzen, Bewegen, Verhalten (AI_BEHAVIOURS) und Bisse. Läuft im Browser und auf dem Server
// (gemeinsame Welt), deshalb lesen Verhalten nur s.player, s.turn, s.map, s.creatures und random(s).
import { MAPS, START } from '../content/world.js';
import { CREATURES } from '../content/creatures.js';
import { SPELL_TEXT } from '../content/spells.js';
import { DIRS, distance, entityAt, log, mitigate, random, tileAt } from './core.js';
import { defenseOf } from './inventory.js';

export const creatureAt = (s, x, y) =>
  s.creatures.find((c) => c.respawnAt === null && c.x === x && c.y === y);

// s.others: andere Spieler in der gemeinsamen Welt (nur auf dem Server gesetzt), auf deren Feld nichts tritt.
export const isFree = (s, x, y) =>
  tileAt(s.map, x, y).walkable &&
  !entityAt(s, x, y) &&
  !creatureAt(s, x, y) &&
  !(s.player.x === x && s.player.y === y) &&
  !s.others?.some((p) => p.x === x && p.y === y);


// once: Kreatur kommt nach dem Sieg nicht wieder (Besucher vom Glücksrad).
export const newCreature = (type, x, y, once = false) => ({
  type, x, y, hp: CREATURES[type].hp, spawn: { x, y }, respawnAt: null, once,
});

// Besiegte Bosse (flags.slain) kommen nie wieder.
export function spawnCreatures(s, mapId) {
  return MAPS[mapId].spawns
    .filter((spawn) => !(CREATURES[spawn.type].boss && s.flags.slain?.[spawn.type]))
    .map((spawn) => newCreature(spawn.type, spawn.x, spawn.y));
}

// Wechselt die Karte. Kreaturen der neuen Karte erscheinen frisch, nie auf dem Ankunftsfeld.
// In der gemeinsamen Welt schickt der Server die Kreaturen der neuen Karte; bis dahin ist sie leer.
export function enterMap(s, mapId, x, y) {
  s.map = mapId;
  s.player.x = x;
  s.player.y = y;
  s.creatures = s.shared ? [] : spawnCreatures(s, mapId).filter((c) => !(c.x === x && c.y === y));
  s.worldMap = null;
}

// Rüstung zieht ihre Abwehr vom Schaden ab, aber höchstens die Hälfte des Schlags (siehe mitigate).
export const damageFrom = (s, def) => mitigate(def.atk, defenseOf(s));

// Auf dem Server (s.onHurt) trifft der Biss einen echten Spieler; sein Browser rechnet den Schaden.
export function hurtPlayer(s, def) {
  if (s.onHurt) {
    s.onHurt(def);
    return false;
  }
  // Zauber WARD (seit Tag 7): Solange der Tintenring hält, prallen Bisse ab.
  // Bosse sind zu groß für den Ring (seit dem Rebalance): Er hält einen ihrer Bisse ab und zerbricht.
  if (s.player.ward > 0 && def.boss) {
    s.player.ward = 0;
    log(s, `The ${def.name} ${def.biteVerb ?? 'bites'} you. ${SPELL_TEXT.wardBreaks}`, 'spell');
    return false;
  }
  if (s.player.ward > 0) {
    s.player.ward -= 1;
    log(s, `The ${def.name} ${def.biteVerb ?? 'bites'} you. ${SPELL_TEXT.wardHolds}`, 'spell');
    if (!s.player.ward) log(s, SPELL_TEXT.wardGone);
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

export function stepCreature(s, c, dx, dy) {
  if (isFree(s, c.x + dx, c.y + dy)) {
    c.x += dx;
    c.y += dy;
    return true;
  }
  return false;
}

export function wander(s, c) {
  if (random(s) < 0.5) return;
  const [dx, dy] = Object.values(DIRS)[Math.floor(random(s) * 4)];
  stepCreature(s, c, dx, dy);
}

// Ein Schritt auf den Spieler zu. Rückgabe true, wenn die Kreatur sich bewegt hat.
export function approach(s, c) {
  const dx = Math.sign(s.player.x - c.x);
  const dy = Math.sign(s.player.y - c.y);
  const horizontalFirst = Math.abs(s.player.x - c.x) >= Math.abs(s.player.y - c.y);
  return Boolean(horizontalFirst
    ? (dx && stepCreature(s, c, dx, 0)) || (dy && stepCreature(s, c, 0, dy))
    : (dy && stepCreature(s, c, 0, dy)) || (dx && stepCreature(s, c, dx, 0)));
}

// Ein Schritt vom Spieler weg, wenn es einen freien gibt. Rückgabe true, wenn die Kreatur sich bewegt hat.
export function retreat(s, c) {
  const away = Object.values(DIRS).filter(([dx, dy]) =>
    distance({ x: c.x + dx, y: c.y + dy }, s.player) > distance(c, s.player) && isFree(s, c.x + dx, c.y + dy));
  if (!away.length) return false;
  const [dx, dy] = away[Math.floor(random(s) * away.length)];
  return stepCreature(s, c, dx, dy);
}

// Freie gerade Linie zwischen Kreatur und Spieler (gleiche Zeile oder Spalte, dazwischen nur freier Boden).
export function clearLine(s, c) {
  const dx = Math.sign(s.player.x - c.x);
  const dy = Math.sign(s.player.y - c.y);
  if (dx && dy) return false;
  for (let x = c.x + dx, y = c.y + dy; x !== s.player.x || y !== s.player.y; x += dx, y += dy) {
    if (!tileAt(s.map, x, y).walkable || entityAt(s, x, y) || creatureAt(s, x, y)) return false;
  }
  return true;
}

// Ein Biss mit der Trefferchance der Kreatur. Rückgabe true, wenn der Spieler dabei ohnmächtig wurde.
const strike = (s, def) => (random(s) < def.hitChance ? hurtPlayer(s, def) : false);

// Verhalten pro Runde. Rückgabe true heißt: Der Spieler wurde besiegt, die Runde endet sofort.
export const AI_BEHAVIOURS = {
  skulk(s, c, def) {
    const d = distance(c, s.player);
    if (d === 1) {
      return strike(s, def);
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
      return strike(s, def);
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
    return strike(s, def);
  },
  // Der Krümelhaufen (Tag 5): langsam, ein Schritt jede zweite Runde, aber schwer.
  trudge(s, c, def) {
    if (distance(c, s.player) === 1) {
      return strike(s, def);
    }
    if (s.turn % 2 === 1 || distance(c, s.player) > def.senseRange) return false;
    approach(s, c);
    return false;
  },
  // Tintenkrähen (Tag 7): stoßen herab, picken einmal und flattern danach weg. Man trifft sie, wenn sie landen.
  swoop(s, c, def) {
    const d = distance(c, s.player);
    if (d === 1) {
      const fainted = strike(s, def);
      if (!fainted) retreat(s, c);
      return fainted;
    }
    if (d > def.senseRange || !approach(s, c)) wander(s, c);
    return false;
  },
  // Lose Seiten (Tag 7): flattern ziellos, nur manchmal in die richtige Richtung.
  flutter(s, c, def) {
    const d = distance(c, s.player);
    if (d === 1) return strike(s, def);
    if (d <= def.senseRange && random(s) < 0.5 && approach(s, c)) return false;
    wander(s, c);
    return false;
  },
  // Kuckucke (Tag 7): spucken aus der Ferne, wenn sie in gerader Linie freie Sicht haben.
  // Wer nah herankommt, den picken sie und flattern dann weg, aber nur jede zweite Runde (seit dem Rebalance:
  // vorher wichen sie jedes Mal aus, und allein holte man sie nie ein).
  aim(s, c, def) {
    const d = distance(c, s.player);
    if (d === 1) {
      const fainted = strike(s, def);
      if (!fainted && s.turn % 2 === 0) retreat(s, c);
      return fainted;
    }
    if (d > def.senseRange + 2) {
      wander(s, c);
      return false;
    }
    if (d <= def.senseRange && clearLine(s, c)) return strike(s, def);
    // Sonst in eine Linie mit dem Spieler rücken.
    const dx = s.player.x - c.x;
    const dy = s.player.y - c.y;
    const [sx, sy] = Math.abs(dx) <= Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)];
    if (!(sx || sy) || !stepCreature(s, c, sx, sy)) wander(s, c);
    return false;
  },
  // Der Great Cog (Tag 7): festgeschraubt. Beißt daneben, und in jeder geraden Runde reichen seine Zähne
  // reach Felder weit in gerader Linie. Schräg daneben ist man sicher.
  grind(s, c, def) {
    const d = distance(c, s.player);
    if (d === 1) return strike(s, def);
    if (s.turn % 2 === 0 && d <= (def.reach ?? 1) && clearLine(s, c)) return strike(s, def);
    return false;
  },
};
