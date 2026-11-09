// Zauber (seit Tag 7, Daten in content/spells.js). Man kann einen Zauber, solange man sein Buch dabeihat.
// Jeder Zauber kostet Tinte und eine Runde. Läuft nur im Browser: Was er bewirkt, betrifft nur den eigenen
// Spieler (Position, HP, player.ward), deshalb geht er in der gemeinsamen Welt genauso.
import { ITEMS } from '../content/items.js';
import { SPELLS, SPELL_COST, SPELL_TEXT } from '../content/spells.js';
import { DIRS, entityAt, log, tileAt } from './core.js';
import { countItem, takeItem } from './inventory.js';
import { creatureAt, isFree } from './creatures.js';

export const spellById = (id) => SPELLS.find((spell) => spell.id === id) ?? null;

// Welche Zauber der Spieler gerade kann: die, deren Buch er dabeihat, in der Reihenfolge aus content/spells.js.
export const knownSpells = (s) =>
  SPELLS.filter((spell) => Object.keys(ITEMS).some((id) => ITEMS[id].spell === spell.id && countItem(s, id) > 0));

export const knowsSpell = (s, id) => knownSpells(s).some((spell) => spell.id === id);

// Wohin HOP in Richtung dir springen würde, oder null. Das Mittelfeld darf begehbar, tief (low) oder von
// einer Kreatur besetzt sein, aber kein Ding (sonst ließe sich jedes Gitter überspringen).
export function hopTarget(s, dir) {
  const [dx, dy] = DIRS[dir] ?? [0, 0];
  if (!dx && !dy) return null;
  const range = spellById('hop').range ?? 2;
  for (let step = 1; step < range; step += 1) {
    const x = s.player.x + dx * step;
    const y = s.player.y + dy * step;
    const tile = tileAt(s.map, x, y);
    if (entityAt(s, x, y) || !(tile.walkable || tile.low || creatureAt(s, x, y))) return null;
  }
  const x = s.player.x + dx * range;
  const y = s.player.y + dy * range;
  return isFree(s, x, y) ? { x, y } : null;
}

// Wirkt einen Zauber. Rückgabe true, wenn er gewirkt wurde (dann ist eine Runde vergangen).
export function castSpell(s, id, dir = null) {
  const spell = spellById(id);
  if (!spell || !knowsSpell(s, id)) return false;
  if (countItem(s, SPELL_COST) < spell.cost) {
    log(s, SPELL_TEXT.noInk);
    return false;
  }
  if (id === 'mend' && s.player.hp >= s.player.maxHp) {
    log(s, SPELL_TEXT.full);
    return false;
  }
  let target = null;
  if (id === 'hop') {
    target = hopTarget(s, dir);
    if (!target) {
      log(s, spell.failText);
      return false;
    }
  }
  for (let i = 0; i < spell.cost; i += 1) takeItem(s, SPELL_COST);
  s.stats.spells = (s.stats.spells ?? 0) + 1;
  log(s, spell.castText, 'spell');
  if (id === 'ward') s.player.ward = spell.charges;
  if (id === 'mend') s.player.hp = Math.min(s.player.maxHp, s.player.hp + spell.heal);
  if (id === 'hop') {
    s.player.x = target.x;
    s.player.y = target.y;
  }
  return true;
}
