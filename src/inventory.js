// Gegenstände, Ausrüstung, Läden, Knacks und Erfahrung (aus src/game.js gelöst in der Aufräumnacht 7).
import { ITEMS } from '../content/items.js';
import { LEVELS, LEVEL_UP_TEXT } from '../content/levels.js';
import { SHOPS } from '../content/shops.js';
import { SKILLS, SKILL_TEXT } from '../content/skills.js';
import { log } from './core.js';

// Knacks (seit Tag 6): Ränge aus content/skills.js geben atk und def dazu (maxHp sofort beim Lernen).
const skillBonus = (s, stat) =>
  SKILLS.reduce((sum, k) => sum + (s.player.skills?.[k.id] ?? 0) * (k[stat] ?? 0), 0);
export const attackOf = (s) => s.player.atk + (ITEMS[s.player.weapon]?.atk ?? 0) + skillBonus(s, 'atk');
// Rüstung (seit Tag 5): player.armor = { head, body, feet }, def wird vom Schaden abgezogen.
export const ARMOR_SLOTS = ['head', 'body', 'feet'];
export const defenseOf = (s) =>
  Object.values(s.player.armor).reduce((sum, id) => sum + (ITEMS[id]?.def ?? 0), 0) + skillBonus(s, 'def');
export const isWeapon = (id) => ITEMS[id]?.atk !== undefined;
export const isArmor = (id) => Boolean(ITEMS[id]?.slot);

// Gegenstände: Waffen (mit atk) liegen in player.weapon, Rüstung in player.armor, alles andere in player.bag.
const worn = (s) => [s.player.weapon, ...Object.values(s.player.armor)].filter(Boolean);
export const countItem = (s, id) =>
  worn(s).filter((w) => w === id).length + s.player.bag.filter((b) => b === id).length;
export const hasItem = (s, id) => countItem(s, id) > 0;
// Aus dem Beutel zuerst, damit niemand ungefragt seine Waffe oder Rüstung verliert.
export function takeItem(s, id) {
  const index = s.player.bag.indexOf(id);
  if (index >= 0) s.player.bag.splice(index, 1);
  else if (s.player.weapon === id) s.player.weapon = null;
  else if (s.player.armor[ITEMS[id]?.slot] === id) s.player.armor[ITEMS[id].slot] = null;
}
// Eine neue Waffe ersetzt die alte, die alte wandert in den Beutel und geht nie verloren.
// Rüstung zieht man an, wenn der Platz frei ist, sonst kommt sie in den Beutel.
export function giveItem(s, id) {
  const item = ITEMS[id];
  // Manche Dinge zählen beim Bekommen mit (seit Tag 7, zum Beispiel Tinte für ein Event).
  if (item.stat) s.stats[item.stat] = (s.stats[item.stat] ?? 0) + 1;
  if (isWeapon(id)) {
    if (s.player.weapon) s.player.bag.push(s.player.weapon);
    s.player.weapon = id;
  } else if (isArmor(id) && !s.player.armor[item.slot]) {
    s.player.armor[item.slot] = id;
  } else {
    s.player.bag.push(id);
  }
}

// Fenster [ BAG ]: Waffe oder Rüstung aus dem Beutel anlegen. Kostet keine Runde.
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

// Fenster [ BAG ] (seit Tag 6): Dinge mit heal aus dem Beutel benutzen. Kostet keine Runde.
export function useItem(s, id) {
  const item = ITEMS[id];
  const index = s.player.bag.indexOf(id);
  if (index < 0 || !item?.heal) return false;
  if (s.player.hp >= s.player.maxHp) {
    log(s, `You are already fully mended. The ${item.name} can wait.`);
    return false;
  }
  s.player.bag.splice(index, 1);
  s.player.hp = Math.min(s.player.maxHp, s.player.hp + item.heal);
  log(s, `You drink the ${item.name}. HP ${s.player.hp}/${s.player.maxHp}.`);
  return true;
}

// Läden (seit Tag 6, content/shops.js): kaufen kostet keine Runde. Rückgabe true, wenn gekauft.
export function buy(s, shopId, itemId) {
  const shop = SHOPS[shopId];
  const offer = shop?.stock.find((o) => o.item === itemId);
  if (!offer) return false;
  if (countItem(s, shop.currency) < offer.price) {
    log(s, `Not enough ${ITEMS[shop.currency].name}s. The ${ITEMS[itemId].name} costs ${offer.price}.`);
    return false;
  }
  for (let i = 0; i < offer.price; i += 1) takeItem(s, shop.currency);
  giveItem(s, itemId);
  log(s, `You buy a ${ITEMS[itemId].name} for ${offer.price} ${ITEMS[shop.currency].name}s.`);
  describeGain(s, itemId);
  return true;
}

// Knacks (seit Tag 6): ein Punkt pro Aufstieg über Stufe 1, minus die schon vergebenen.
export const skillPoints = (s) =>
  s.player.level - 1 - SKILLS.reduce((sum, k) => sum + (s.player.skills?.[k.id] ?? 0), 0);

export function learnSkill(s, id) {
  const skill = SKILLS.find((k) => k.id === id);
  const skills = (s.player.skills ??= {});
  if (!skill || skillPoints(s) <= 0 || (skills[id] ?? 0) >= skill.max) return false;
  skills[id] = (skills[id] ?? 0) + 1;
  if (skill.maxHp) {
    s.player.maxHp += skill.maxHp;
    s.player.hp += skill.maxHp;
  }
  log(s, `${SKILL_TEXT} ${skill.name} ${skills[id]}/${skill.max}.`, 'new-tonight');
  return true;
}

// Ergebnis einer neuen Sache für das Log: Waffen nennen den Schaden, Rüstung die Abwehr.
export function describeGain(s, id) {
  const item = ITEMS[id];
  if (isWeapon(id) && s.player.weapon === id) log(s, `You now ${item.hitVerb} things for ${attackOf(s)} damage.`);
  else if (isArmor(id) && s.player.armor[item.slot] === id) log(s, `You wear the ${item.name}. Defence ${defenseOf(s)}.`);
}

// Stufen (seit Tag 4): Erfahrung aus Siegen und vom Glücksrad. Nächste Schwelle oder null am Ende der Leiter.
export const nextLevelXp = (s) => LEVELS[s.player.level]?.xp ?? null;

export function gainXp(s, amount) {
  s.player.xp += amount;
  s.stats.xp += amount;
  while (nextLevelXp(s) !== null && s.player.xp >= nextLevelXp(s)) {
    const step = LEVELS[s.player.level];
    s.player.level += 1;
    s.player.maxHp += step.maxHp ?? 0;
    s.player.atk += step.atk ?? 0;
    s.player.hp = s.player.maxHp;
    log(s, LEVEL_UP_TEXT.replace('{level}', s.player.level), 'new-tonight');
    const gains = [step.maxHp && `+${step.maxHp} max HP`, step.atk && `+${step.atk} attack`, '1 knack point'].filter(Boolean);
    if (gains.length) log(s, `${gains.join(', ')}. You are fully mended.`);
  }
}
