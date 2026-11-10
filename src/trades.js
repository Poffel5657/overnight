// Berufe und Werkbank (seit Tag 8). Bergbau: Erz aus Adern schlagen, dabei besser werden.
// Werkbank: Der Spieler wählt im Fenster [ WORKBENCH ], was entsteht (craft), statt dass die Bank rät.
import { ITEMS } from '../content/items.js';
import { RECIPES } from '../content/recipes.js';
import { MINING } from '../content/trades.js';
import { currentDay, log, random } from './core.js';
import { countItem, describeGain, gainXp, giveItem, hasItem, takeItem } from './inventory.js';

// Rang im Bergbau: Index in MINING.ranks (0 = Novice), aus der Zahl der Schläge in player.mining.
export const miningStrikes = (s) => (Number.isInteger(s.player.mining) && s.player.mining > 0 ? s.player.mining : 0);
export function miningRank(s) {
  const strikes = miningStrikes(s);
  let rank = 0;
  MINING.ranks.forEach((r, i) => { if (strikes >= r.at) rank = i; });
  return rank;
}
// Nächste Schwelle oder null beim höchsten Rang.
export const nextMiningRank = (s) => MINING.ranks[miningRank(s) + 1] ?? null;

// Wie viele Schläge eine Ader heute noch hergibt (flags.veins[id] = { day, used }).
export function veinLeft(s, e) {
  const v = s.flags.veins?.[e.id];
  return v?.day === currentDay() ? Math.max(0, e.amount - v.used) : e.amount;
}

// Gegen eine Ader laufen (Objektart vein). Kostet eine Runde wie jedes Objekt.
export function mineVein(s, e) {
  if (!hasItem(s, MINING.tool)) {
    log(s, MINING.noToolText);
    return false;
  }
  const rank = MINING.ranks[miningRank(s)];
  if (e.deep && !rank.deep) {
    log(s, MINING.deepText);
    return false;
  }
  const left = veinLeft(s, e);
  if (left <= 0) {
    log(s, e.dryText);
    return false;
  }
  (s.flags.veins ??= {})[e.id] = { day: currentDay(), used: e.amount - left + 1 };
  const before = miningRank(s);
  s.player.mining = miningStrikes(s) + 1;
  giveItem(s, e.ore);
  log(s, `${e.text} (${left - 1} left tonight)`, 'new-tonight');
  if (random(s) < rank.bonus) {
    giveItem(s, e.ore);
    log(s, MINING.bonusText);
  }
  const after = miningRank(s);
  if (after > before) log(s, MINING.rankUpText.replace('{title}', MINING.ranks[after].title), 'new-tonight');
  if (MINING.xp) gainXp(s, MINING.xp);
  return true;
}

// Was einem Rezept noch fehlt: [{ id, need, have }] für jede Zutat.
export function recipeNeeds(s, recipe) {
  const ids = [...new Set(recipe.needs)];
  return ids.map((id) => ({ id, need: recipe.needs.filter((n) => n === id).length, have: countItem(s, id) }));
}
export const canCraft = (s, recipe) => recipeNeeds(s, recipe).every((n) => n.have >= n.need);

// Werkbank: Rezept herstellen. Kostet keine Runde (wie Kaufen). Rückgabe true, wenn etwas entstanden ist.
export function craft(s, id) {
  const recipe = RECIPES.find((r) => r.id === id);
  if (!recipe) return false;
  if (!canCraft(s, recipe)) {
    log(s, recipe.hint);
    return false;
  }
  for (const need of recipe.needs) takeItem(s, need);
  giveItem(s, recipe.makes);
  log(s, recipe.text, 'new-tonight');
  describeGain(s, recipe.makes);
  return true;
}

// Gegen die Werkbank laufen: Der Browser öffnet danach das Fenster [ WORKBENCH ] (s.openBench, nie gespeichert).
// Im Log steht, ob gerade etwas geht, damit man es auch ohne Fenster versteht.
export function useBench(s, e) {
  s.openBench = e.id;
  const ready = RECIPES.filter((r) => canCraft(s, r));
  if (ready.length) {
    log(s, `${e.name === 'Workbench' ? 'The workbench' : `The ${e.name}`} hums. It could make: ${ready.map((r) => ITEMS[r.makes].name).join(', ')}.`);
    return;
  }
  const partial = RECIPES.find((r) => r.needs.some((id) => hasItem(s, id)));
  log(s, partial ? partial.hint : e.text);
}
