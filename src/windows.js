// Fenster [ CHARA ], [ BAG ], [ SHOP ] und [ WORKBENCH ] (seit Tag 8) und die Balken der Leiste unter der Karte.
// In der Aufräumnacht 7 aus src/main.js gelöst; main.js ruft setupWindows() einmal auf.
import {
  attackOf, buy, canCraft, countItem, craft, defenseOf, equip, hasItem, learnSkill, miningRank, miningStrikes, nextLevelXp,
  nextMiningRank, recipeNeeds, skillPoints, ARMOR_SLOTS,
} from './game.js';
import { RECIPES } from '../content/recipes.js';
import { MINING } from '../content/trades.js';
import { ITEMS } from '../content/items.js';
import { SHOPS } from '../content/shops.js';
import { SKILLS } from '../content/skills.js';
import { LEVELS } from '../content/levels.js';

const $ = (id) => document.getElementById(id);

export const XP_CELLS = 10;

// Balken aus Zeichen, passend zum Terminal-Look.
export const bar = (part, whole, cells, full = '█', empty = '·') => {
  const filled = whole > 0 ? Math.max(0, Math.min(cells, Math.round((part / whole) * cells))) : cells;
  return `[${full.repeat(filled)}${empty.repeat(cells - filled)}]`;
};

// Gleiche Dinge im Beutel werden gezählt, in der Reihenfolge, in der sie dazukamen.
export function bagCounts(s) {
  const counts = new Map();
  for (const id of s.player.bag) if (ITEMS[id]) counts.set(id, (counts.get(id) ?? 0) + 1);
  return counts;
}

// XP seit der letzten Stufe und bis zur nächsten; null, wenn die höchste Stufe erreicht ist.
export function xpProgress(s) {
  const { xp, level } = s.player;
  const next = nextLevelXp(s);
  // Der Balken füllt sich von der Schwelle der jetzigen Stufe bis zur nächsten.
  const prev = Math.min(xp, LEVELS[level - 1]?.xp ?? 0);
  return { xp, next, fill: next === null ? 1 : (xp - prev) / (next - prev) };
}

// Fenster [ CHARA ] und [ BAG ] (vorher ein gemeinsames Fenster GEAR seit Tag 5).
const SLOT_LABELS = { weapon: 'WEAPON', head: 'HEAD', body: 'BODY', feet: 'FEET' };

export const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

// Eine Zeile mit Name, Wert und Beschreibung. Wird auch vom Laden benutzt.
function gearRow(label, id, action) {
  const row = el('li', 'gear-row');
  const item = ITEMS[id];
  row.append(el('span', 'gear-kind', label));
  const name = el('span', item ? 'gear-name' : 'gear-name gear-none', item ? item.name : '— nothing —');
  const stat = item?.atk !== undefined ? ` +${item.atk} ATK` : item?.def ? ` +${item.def} DEF` : item?.heal ? ` +${item.heal} HP` : '';
  if (stat) name.append(el('span', 'gear-bonus', stat));
  row.append(name);
  if (action) row.append(action);
  if (item?.text) row.append(el('span', 'gear-text', item.text));
  return row;
}

// Was ein Teil aus dem Beutel gegenüber dem Getragenen bringt: ▲ besser, ▼ schlechter, = gleich.
function compareTo(id) {
  const item = ITEMS[id];
  const isWeapon = item.atk !== undefined;
  const worn = ITEMS[isWeapon ? state.player.weapon : state.player.armor[item.slot]];
  const value = isWeapon ? item.atk : item.def ?? 0;
  const delta = value - (isWeapon ? worn?.atk ?? 0 : worn?.def ?? 0);
  const unit = isWeapon ? 'ATK' : 'DEF';
  const node = el('span', 'gear-compare', '');
  if (delta > 0) { node.classList.add('better'); node.textContent = `▲ ${delta} ${unit}`; }
  else if (delta < 0) { node.classList.add('worse'); node.textContent = `▼ ${-delta} ${unit}`; }
  else node.textContent = `= ${unit}`;
  node.title = worn ? `instead of ${worn.name}` : 'nothing worn there yet';
  return node;
}

// Knopf in CHARA oder BAG: führt die Aktion aus, speichert, zeichnet neu und zeigt die Antwort
// der Welt im Fenster, denn das Log liegt hinter dem Dialog.
function windowButton(label, action, statusId) {
  const button = el('button', 'gear-equip', label);
  button.addEventListener('click', () => {
    const before = state.log.length;
    action();
    save();
    refresh();
    drawWindows();
    if (state.log.length > before) $(statusId).textContent = state.log.at(-1).text;
  });
  return button;
}

function drawChara() {
  const p = state.player;
  const { xp, next, fill } = xpProgress(state);
  const weapon = ITEMS[p.weapon];
  const atk = attackOf(state);
  const atkKnacks = atk - p.atk - (weapon?.atk ?? 0);
  const armorDef = ARMOR_SLOTS.reduce((sum, slot) => sum + (ITEMS[p.armor[slot]]?.def ?? 0), 0);
  const def = defenseOf(state);
  const points = skillPoints(state);
  const rows = [
    ['LEVEL', String(p.level), next === null ? 'highest level' : `${next - xp} XP to level ${p.level + 1}`],
    ['XP', next === null ? String(xp) : `${bar(fill, 1, XP_CELLS)} ${xp}/${next}`, ''],
    ['HP', `${bar(p.hp, p.maxHp, XP_CELLS)} ${p.hp}/${p.maxHp}`, ''],
    ['ATK', String(atk), [`${p.atk} base`, weapon && `+${weapon.atk} ${weapon.name}`, atkKnacks && `+${atkKnacks} knacks`].filter(Boolean).join(' · ')],
    ['DEF', String(def), [`${armorDef} armour`, def - armorDef && `+${def - armorDef} knacks`].filter(Boolean).join(' · ')],
  ];
  $('chara-stats').replaceChildren(...rows.flatMap(([label, value, note]) => {
    const dd = el('dd', '', value);
    if (note) dd.append(el('span', 'stat-note', `  (${note})`));
    return [el('dt', '', label), dd];
  }));
  $('chara-worn').replaceChildren(
    gearRow(SLOT_LABELS.weapon, p.weapon),
    ...ARMOR_SLOTS.map((slot) => gearRow(SLOT_LABELS[slot], p.armor[slot])),
  );

  // Knacks (seit Tag 6): Punkte aus Aufstiegen in Ränge stecken.
  $('chara-points').textContent = points > 0
    ? `${points} point${points > 1 ? 's' : ''} to spend`
    : 'one point per level';
  $('chara-points').classList.toggle('ready', points > 0);
  $('chara-knacks').replaceChildren(...SKILLS.map((skill) => {
    const rank = state.player.skills?.[skill.id] ?? 0;
    const row = el('li', 'gear-row');
    row.dataset.skill = skill.id;
    row.append(el('span', 'gear-kind pips', '■'.repeat(rank) + '□'.repeat(skill.max - rank)));
    row.lastChild.setAttribute('aria-label', `rank ${rank} of ${skill.max}`);
    row.append(el('span', 'gear-name', skill.name));
    if (points > 0 && rank < skill.max) row.append(windowButton('Learn', () => learnSkill(state, skill.id), 'chara-status'));
    else if (rank >= skill.max) row.append(el('span', 'gear-done', 'mastered'));
    row.append(el('span', 'gear-text', skill.text));
    return row;
  }));

  // Berufe (seit Tag 8): Rang als Kästchen, Titel, Schläge bis zum nächsten Rang.
  const rank = miningRank(state);
  const strikes = miningStrikes(state);
  const nextRank = nextMiningRank(state);
  const trade = el('li', 'gear-row');
  trade.dataset.trade = 'mining';
  trade.append(el('span', 'gear-kind pips', '■'.repeat(rank + 1) + '□'.repeat(MINING.ranks.length - rank - 1)));
  trade.lastChild.setAttribute('aria-label', `rank ${rank + 1} of ${MINING.ranks.length}`);
  trade.append(el('span', 'gear-name', `${MINING.name}: ${MINING.ranks[rank].title}`));
  trade.append(el('span', 'gear-done', nextRank ? `${strikes}/${nextRank.at} to ${nextRank.title}` : `${strikes} strikes`));
  const hint = hasItem(state, MINING.tool) ? MINING.text : `${MINING.text} First you need a pick: one lies by the gear pits of Mainspring.`;
  trade.append(el('span', 'gear-text', hint));
  $('chara-trades').replaceChildren(trade);
}

function drawBag() {
  const counts = bagCounts(state);
  const use = [];
  const gear = [];
  const other = [];
  for (const [id, n] of counts) {
    const item = ITEMS[id];
    const label = n > 1 ? `x${n}` : '';
    if (item.atk !== undefined || item.slot) {
      const button = windowButton(item.slot ? 'Wear' : 'Wield', () => equip(state, id), 'bag-status');
      const row = gearRow(label, id, button);
      row.dataset.item = id;
      button.before(compareTo(id));
      gear.push(row);
    } else if (item.heal) {
      const button = windowButton('Use', () => perform(`use:${id}`), 'bag-status');
      const full = state.player.hp >= state.player.maxHp;
      button.disabled = full;
      if (full) button.title = 'You are already fully mended.';
      const row = gearRow(label, id, button);
      row.dataset.item = id;
      use.push(row);
    } else {
      const row = gearRow(label, id, null);
      row.dataset.item = id;
      other.push(row);
    }
  }
  for (const [list, rows] of [['use', use], ['gear', gear], ['other', other]]) {
    $(`bag-${list}`).replaceChildren(...rows);
    $(`bag-section-${list}`).hidden = rows.length === 0;
  }
  const total = state.player.bag.length;
  $('bag-total').textContent = total ? `${total} thing${total === 1 ? '' : 's'}` : '';
  $('bag-empty').hidden = total > 0;
}

export function drawWindows() {
  if ($('chara-dialog').open) drawChara();
  if ($('bag-dialog').open) drawBag();
  if ($('bench-dialog').open) drawBench();
}

// Fenster [ WORKBENCH ] (seit Tag 8): alle Rezepte, zuerst was geht. Bei den anderen steht, was fehlt.
function drawBench() {
  const ready = [];
  const later = [];
  for (const recipe of RECIPES) {
    const ok = canCraft(state, recipe);
    const button = windowButton('Make', () => craft(state, recipe.id), 'bench-status');
    button.disabled = !ok;
    const row = gearRow('', recipe.makes, button);
    row.dataset.recipe = recipe.id;
    const needs = recipeNeeds(state, recipe).map((n) => {
      return el('span', n.have >= n.need ? 'need-ok' : 'need-missing', `${n.need}× ${ITEMS[n.id].name} (${Math.min(n.have, n.need)}/${n.need})`);
    });
    const line = el('span', 'gear-needs');
    needs.forEach((part, i) => { if (i) line.append(' + '); line.append(part); });
    button.after(line);
    (ok ? ready : later).push(row);
  }
  $('bench-ready').replaceChildren(...ready);
  $('bench-later').replaceChildren(...later);
  $('bench-none').hidden = ready.length > 0;
}

export function openBench() {
  if (!state.openBench) return;
  state.openBench = null;
  $('bench-status').textContent = '';
  for (const id of ['chara-dialog', 'bag-dialog', 'shop-dialog']) if ($(id).open) $(id).close();
  drawBench();
  if (!$('bench-dialog').open) $('bench-dialog').showModal();
}

// Fenster [ SHOP ] (seit Tag 6): öffnet sich, wenn man in einen Stand läuft (state.openShop).
let shopId = null;

function drawShop() {
  const shop = SHOPS[shopId];
  if (!shop) return;
  $('shop-title').textContent = `[ ${shop.name.toUpperCase()} ]`;
  $('shop-greeting').textContent = shop.greeting;
  const purse = ITEMS[shop.currency];
  $('shop-purse').textContent = `You have ${countItem(state, shop.currency)} ${purse.name}s.`;
  $('shop-stock').replaceChildren(...shop.stock.map((offer) => {
    const row = gearRow(`${offer.price}×`, offer.item, null);
    row.dataset.item = offer.item;
    const button = document.createElement('button');
    button.className = 'gear-equip';
    button.textContent = 'Buy';
    button.disabled = countItem(state, shop.currency) < offer.price;
    button.addEventListener('click', () => {
      buy(state, shopId, offer.item);
      save();
      refresh();
      drawShop();
    });
    row.querySelector('.gear-name').after(button);
    return row;
  }));
}

export function openShop() {
  if (!state.openShop) return;
  shopId = state.openShop;
  state.openShop = null;
  drawShop();
  if (!$('shop-dialog').open) $('shop-dialog').showModal();
}

// Tasten, die ein Fenster öffnen statt einen Zug zu machen.
const WINDOW_KEYS = { c: 'chara-dialog', b: 'bag-dialog', i: 'bag-dialog', g: 'bag-dialog' };

function openWindow(id) {
  for (const other of ['chara-dialog', 'bag-dialog']) if (other !== id && $(other).open) $(other).close();
  $('chara-status').textContent = '';
  $('bag-status').textContent = '';
  if (id === 'chara-dialog') drawChara(); else drawBag();
  if (!$(id).open) $(id).showModal();
}

// state: der laufende Spielstand, save(): speichern, refresh(): Karte, Leiste und Log neu zeichnen.
let state = null;
let save = () => {};
let refresh = () => {};
// perform(action): ein Spielzug über main.js, mit Abklingzeit in der gemeinsamen Welt (Trinken kostet eine Runde).
let perform = () => {};

export function setupWindows(options) {
  ({ state, save, refresh, perform } = options);
  $('open-chara').addEventListener('click', () => openWindow('chara-dialog'));
  $('open-bag').addEventListener('click', () => openWindow('bag-dialog'));
  for (const button of document.querySelectorAll('[data-switch]')) {
    button.addEventListener('click', () => openWindow(button.dataset.switch));
  }
  for (const button of document.querySelectorAll('[data-close]')) {
    button.addEventListener('click', () => button.closest('dialog').close());
  }
  // Ein Klick neben das Fenster schließt es, wie man es von Spielen kennt.
  for (const id of ['chara-dialog', 'bag-dialog', 'shop-dialog', 'bench-dialog']) {
    $(id).addEventListener('click', (event) => { if (event.target === $(id)) $(id).close(); });
  }
  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.target.closest?.('input, textarea, select, [contenteditable]')) return;
    if (document.body.classList.contains('chat-open')) return;
    const id = WINDOW_KEYS[event.key.toLowerCase()];
    if (!id) return;
    const open = document.querySelector('dialog[open]');
    // Dieselbe Taste schließt das Fenster wieder; aus CHARA geht es mit B direkt in den Beutel.
    if (open && open.id === id) { event.preventDefault(); open.close(); return; }
    if (open && !['chara-dialog', 'bag-dialog'].includes(open.id)) return;
    event.preventDefault();
    openWindow(id);
  });
}
