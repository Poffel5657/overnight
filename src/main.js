// Verbindet Spiellogik, Darstellung und Bedienung im Browser.
import {
  act, attackOf, countItem, createGame, currentDay, defenseOf, equip, log, nextLevelXp, questState, ARMOR_SLOTS,
  applyWorld, isAttack, leaveWorld, rewardKill, takeBite, buy, useItem, learnSkill, skillPoints, questProgress,
} from './game.js';
import { createRenderer } from './render.js';
import { loadSave, saveKey, writeSave } from './save.js';
import { setupSuggestions } from './suggest.js';
import { setupVoting } from './vote.js';
import { setupEvent } from './event.js';
import { setupQuestLog, updateQuests } from './quests.js';
import { setupRating } from './rate.js';
import { setupChat } from './chat.js';
import { setupPresence } from './presence.js';
import { CONTACT_EMAIL } from './config.js';
import { crtEnabled, reducedMotion, setupBoot, setupCountdown, setupCrt } from './terminal.js';
import { CHRONICLE } from '../content/chronicle.js';
import { ITEMS } from '../content/items.js';
import { MAPS } from '../content/world.js';
import { CREATURES } from '../content/creatures.js';
import { BALLOT } from '../content/ballot.js';
import { QUESTS } from '../content/quests.js';
import { PRESENCE } from '../content/presence.js';
import { SHOPS } from '../content/shops.js';
import { SKILLS } from '../content/skills.js';
import { LEVELS } from '../content/levels.js';

const KEYS = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  w: 'up', s: 'down', a: 'left', d: 'right', ' ': 'wait',
};

const $ = (id) => document.getElementById(id);
const pad3 = (n) => String(n).padStart(3, '0');
const archivedDay = location.pathname.match(/\/day\/(\d{3})\//)?.[1] ?? null;

const key = saveKey();
const seedParam = new URLSearchParams(location.search).get('seed');
const state = createGame({
  saved: loadSave(key),
  seed: seedParam === null ? Date.now() : Number(seedParam),
});

let glow = crtEnabled();
// Echos (andere Spieler) werden weiter unten verbunden; bis dahin gibt es keine.
let presence = { here: () => [], total: () => 0, moved() {}, send() {}, myId: () => null, active: false };
const draw = createRenderer($('world'), {
  glow: () => glow,
  marker: !archivedDay,
  echoes: () => ({ list: presence.here(), color: PRESENCE.color, chatOf }),
});

const HP_CELLS = 14;
const XP_CELLS = 10;

// Balken aus Zeichen, passend zum Terminal-Look.
const bar = (part, whole, cells, full = '█', empty = '·') => {
  const filled = whole > 0 ? Math.max(0, Math.min(cells, Math.round((part / whole) * cells))) : cells;
  return `[${full.repeat(filled)}${empty.repeat(cells - filled)}]`;
};

// Gleiche Dinge im Beutel werden gezählt, in der Reihenfolge, in der sie dazukamen.
function bagCounts() {
  const counts = new Map();
  for (const id of state.player.bag) if (ITEMS[id]) counts.set(id, (counts.get(id) ?? 0) + 1);
  return counts;
}

// XP seit der letzten Stufe und bis zur nächsten; null, wenn die höchste Stufe erreicht ist.
function xpProgress() {
  const { xp, level } = state.player;
  const next = nextLevelXp(state);
  // Der Balken füllt sich von der Schwelle der jetzigen Stufe bis zur nächsten.
  const prev = Math.min(xp, LEVELS[level - 1]?.xp ?? 0);
  return { xp, next, fill: next === null ? 1 : (xp - prev) / (next - prev) };
}

// Unter der Karte nur das Nötigste: HP, Stufe und Erfahrung, dazu die Knöpfe CHARA und BAG.
function drawHud() {
  const { hp, maxHp, level } = state.player;
  const weapon = ITEMS[state.player.weapon];
  const counts = bagCounts();
  const bag = [...counts].map(([id, n]) => (n > 1 ? `${ITEMS[id].name} x${n}` : ITEMS[id].name));
  const { xp, next, fill } = xpProgress();
  const xpText = `${level} · XP ${xp}${next === null ? '' : `/${next}`}`;
  // Voller Text für Screenreader und Tests, die sichtbare Anzeige steht daneben.
  const def = defenseOf(state);
  const parts = [MAPS[state.map].name, `HP ${hp}/${maxHp}`, `LV ${xpText}`];
  if (weapon) parts.push(weapon.name);
  if (def) parts.push(`defence ${def}`);
  if (bag.length) parts.push(`bag: ${bag.join(', ')}`);
  $('hp-label').textContent = parts.join(' · ');
  $('map-name').textContent = MAPS[state.map].name;

  $('hp-meter').textContent = `HP ${bar(hp, maxHp, HP_CELLS)} ${hp}/${maxHp}`;
  $('hp-meter').classList.toggle('low', hp <= maxHp * 0.3);
  $('xp-meter').textContent = next === null
    ? `LV ${level} · MAX`
    : `LV ${level} ${bar(fill, 1, XP_CELLS)} ${xp}/${next} XP`;

  // Ein offener Knack-Punkt fällt am Knopf auf, sonst merkt ihn niemand.
  const points = skillPoints(state);
  $('chara-badge').hidden = points <= 0;
  $('chara-badge').textContent = points > 0 ? ` +${points}` : '';
  $('open-chara').setAttribute('aria-label', points > 0 ? `Character, ${points} knack point${points > 1 ? 's' : ''} to spend` : 'Character');
  const total = state.player.bag.length;
  $('bag-count').textContent = total ? ` ${total}` : '';
  $('open-bag').setAttribute('aria-label', `Bag, ${total} thing${total === 1 ? '' : 's'}`);
}

// Fenster [ CHARA ] und [ BAG ] (vorher ein gemeinsames Fenster GEAR seit Tag 5).
const SLOT_LABELS = { weapon: 'WEAPON', head: 'HEAD', body: 'BODY', feet: 'FEET' };

const el = (tag, className, text) => {
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
    writeSave(key, state);
    refresh();
    drawWindows();
    if (state.log.length > before) $(statusId).textContent = state.log.at(-1).text;
  });
  return button;
}

function drawChara() {
  const p = state.player;
  const { xp, next, fill } = xpProgress();
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
}

function drawBag() {
  const counts = bagCounts();
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
      const button = windowButton('Use', () => useItem(state, id), 'bag-status');
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

function drawWindows() {
  if ($('chara-dialog').open) drawChara();
  if ($('bag-dialog').open) drawBag();
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
      writeSave(key, state);
      refresh();
      drawShop();
    });
    row.querySelector('.gear-name').after(button);
    return row;
  }));
}

function openShop() {
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

function setupWindows() {
  $('open-chara').addEventListener('click', () => openWindow('chara-dialog'));
  $('open-bag').addEventListener('click', () => openWindow('bag-dialog'));
  for (const button of document.querySelectorAll('[data-switch]')) {
    button.addEventListener('click', () => openWindow(button.dataset.switch));
  }
  for (const button of document.querySelectorAll('[data-close]')) {
    button.addEventListener('click', () => button.closest('dialog').close());
  }
  // Ein Klick neben das Fenster schließt es, wie man es von Spielen kennt.
  for (const id of ['chara-dialog', 'bag-dialog', 'shop-dialog']) {
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

// Die neueste Logzeile tippt sich ein wie auf einem Terminal.
let typed = { text: '', shown: 0 };
let typingTimer = null;

function drawLog() {
  const entries = state.log.slice(-5);
  const items = entries.map(({ text, kind }) => {
    const li = document.createElement('li');
    li.textContent = text;
    if (kind) li.className = kind;
    return li;
  });
  $('log').replaceChildren(...items);
  const last = items.at(-1);
  if (!last) return;
  const text = entries.at(-1).text;
  if (reducedMotion() || typed.text === text) {
    typed = { text, shown: text.length };
    return;
  }
  typed = { text, shown: 0 };
  clearInterval(typingTimer);
  last.textContent = '';
  typingTimer = setInterval(() => {
    typed.shown = Math.min(typed.text.length, typed.shown + 3);
    const current = $('log').lastElementChild;
    if (current) current.textContent = typed.text.slice(0, typed.shown);
    if (typed.shown >= typed.text.length) clearInterval(typingTimer);
  }, 16);
}

function refresh() {
  draw(state);
  drawHud();
  drawLog();
  updateQuests(QUESTS, (id) => questState(state, id), (quest) => questProgress(state, quest));
  $('log-peek').textContent = state.log.at(-1)?.text ?? '';
}

// Am Handy lässt sich das Log einklappen, damit die Karte mehr Platz hat. Die Wahl bleibt gespeichert.
function setupLogToggle() {
  const KEY = 'overnight.log';
  const button = $('log-toggle');
  const apply = (collapsed) => {
    $('log-window').classList.toggle('collapsed', collapsed);
    button.textContent = collapsed ? 'Show' : 'Hide';
    button.setAttribute('aria-expanded', String(!collapsed));
  };
  let collapsed = false;
  try { collapsed = localStorage.getItem(KEY) === 'hidden'; } catch { /* ohne Speicher offen */ }
  apply(collapsed);
  button.addEventListener('click', () => {
    collapsed = !collapsed;
    try { localStorage.setItem(KEY, collapsed ? 'hidden' : 'shown'); } catch { /* egal */ }
    apply(collapsed);
  });
}

// Menüs in der Kopfzeile: eins zur Zeit offen, schließt bei Klick daneben, Escape oder Auswahl.
function setupMenus() {
  const buttons = [...document.querySelectorAll('.menu-button[aria-controls]')];
  const panelOf = (button) => $(button.getAttribute('aria-controls'));
  const close = () => {
    for (const button of buttons) {
      button.setAttribute('aria-expanded', 'false');
      panelOf(button).hidden = true;
    }
  };
  for (const button of buttons) {
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      close();
      button.setAttribute('aria-expanded', String(open));
      panelOf(button).hidden = !open;
    });
    // Ein Punkt im Menü öffnet einen Dialog oder eine Seite, danach braucht es das Menü nicht mehr.
    for (const item of panelOf(button).querySelectorAll('button, a')) item.addEventListener('click', close);
  }
  document.addEventListener('pointerdown', (event) => {
    if (!event.target.closest('.menu')) close();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });
}

function setupTonight() {
  const latest = CHRONICLE.at(-1);
  $('tonight-title').textContent = `Day ${latest.day}: ${latest.title}`;
  $('tonight-text').textContent = latest.text;
  // Wer hat die letzte Abstimmung gewonnen? Steht im Stimmzettel, sobald der Nachtlauf gezählt hat.
  const result = BALLOT?.lastResult;
  const winner = result?.options?.find((option) => option.won);
  if (winner) {
    const total = result.options.reduce((sum, option) => sum + option.votes, 0);
    $('tonight-vote').textContent = `Vote winner: ${winner.text} (${winner.votes} of ${total} votes)`;
    $('tonight-vote').hidden = false;
  }
  // In alten Versionen gibt es nichts mehr vorzuschlagen oder abzustimmen.
  $('shape').hidden = Boolean(archivedDay);
}

let updateEvent = () => {};

// In der gemeinsamen Welt läuft die Zeit von selbst. Spieler haben deshalb Abklingzeiten:
// ein Schritt pro PRESENCE.moveMs, ein Schlag pro PRESENCE.attackMs. Ein Tastendruck kurz vor Ablauf
// wird vorgemerkt, damit gehaltene Tasten gleichmäßig laufen; frühere werden verworfen.
const BUFFER_MS = 70;
let readyAt = 0;
let queued = null;
let queueTimer = null;

function perform(action) {
  if (!state.shared) {
    run(action);
    return;
  }
  const wait = readyAt - Date.now();
  if (wait > BUFFER_MS) return;
  queued = action;
  clearTimeout(queueTimer);
  if (wait > 0) queueTimer = setTimeout(pump, wait);
  else pump();
}

function pump() {
  const action = queued;
  queued = null;
  if (!action) return;
  if (!state.shared) {
    run(action);
    return;
  }
  const gap = isAttack(state, action) ? PRESENCE.attackMs : PRESENCE.moveMs;
  run(action);
  readyAt = Date.now() + (gap ?? 200);
}

function run(action) {
  act(state, action);
  writeSave(key, state);
  refresh();
  updateEvent();
  presence.moved();
  if (state.outbox?.length) presence.send(state.outbox.splice(0));
  openShop();
}

// Chatnachrichten als Sprechblase über der Figur, die sie geschrieben hat. Chat und Echos haben
// denselben anonymen Tagesnamen, darüber findet die Blase ihr "@". null steht für den eigenen Spieler.
const CHAT_BUBBLE_MS = 7000;
const chatBubbles = new Map();
function chatOf(name) {
  const bubble = chatBubbles.get(name);
  return bubble && bubble.until > Date.now() ? bubble.text : null;
}
function setupChatBubbles() {
  document.addEventListener('overnight:chat', (event) => {
    const { id, name, text, mine } = event.detail ?? {};
    if (typeof text !== 'string' || typeof name !== 'string') return;
    chatBubbles.set(mine ? null : name, { id, text, until: Date.now() + CHAT_BUBBLE_MS });
    draw(state);
    setTimeout(() => draw(state), CHAT_BUBBLE_MS + 50);
  });
  // Gemeldete oder versteckte Nachrichten verschwinden auch von der Karte.
  document.addEventListener('overnight:chat-hide', (event) => {
    for (const [key, bubble] of chatBubbles) if (bubble.id === event.detail?.id) chatBubbles.delete(key);
    draw(state);
  });
}

// Anzeige über der Karte: wie viele Echos hier und insgesamt unterwegs sind.
function drawEchoCount() {
  const label = $('echo-count');
  if (!presence.active) {
    label.hidden = true;
    return;
  }
  const here = presence.here().length;
  const total = presence.total();
  label.hidden = false;
  label.textContent = total === 0 ? '· alone' : `· ${here} here · ${total} out there`;
}

function setupEchoes() {
  const echoParam = new URLSearchParams(location.search).get('echoes') === '1';
  presence = setupPresence({
    archived: Boolean(archivedDay),
    enabled: echoParam || currentDay() >= PRESENCE.fromDay,
    getPosition: () => ({ map: state.map, x: state.player.x, y: state.player.y }),
    knownMap: (id) => Object.hasOwn(MAPS, id),
    onChange: () => {
      draw(state);
      drawEchoCount();
    },
    // Gemeinsame Welt: Kreaturen vom Server, oder zurück zur eigenen, wenn er die Karte nicht kennt.
    onWorld: (map, creatures) => {
      if (map !== state.map) return;
      if (creatures === null) leaveWorld(state);
      else applyWorld(state, creatures);
      draw(state);
    },
    onBite: (type) => {
      const mapBefore = state.map;
      takeBite(state, type);
      writeSave(key, state);
      refresh();
      updateEvent();
      if (state.map !== mapBefore) presence.moved();
    },
    onSlain: (type, by, mine) => {
      const def = CREATURES[type];
      if (!def) return;
      const others = by.filter((p) => p.id !== presence.myId()).map((p) => p.name);
      if (mine) {
        // Siege zusammen mit einem Echo zählen für die Quest "Many Hands" (seit Tag 6).
        if (others.length) state.stats.together = (state.stats.together ?? 0) + 1;
        const text = others.length
          ? `Together with ${others.join(' and ')} you defeat the ${def.name}.`
          : `You defeat the ${def.name}.`;
        rewardKill(state, type, text);
        writeSave(key, state);
      } else if (others.length) {
        log(state, `${others.join(' and ')} defeated the ${def.name}.`, 'echo');
      }
      refresh();
      updateEvent();
    },
    onLost: () => {
      leaveWorld(state);
      draw(state);
    },
  });
  drawEchoCount();
}

// Begrüßung: Wer wiederkommt, erfährt, was seit dem letzten Besuch entstanden ist.
function greet() {
  const day = currentDay();
  const newEntries = state.lastSeenDay === null
    ? []
    : CHRONICLE.filter((entry) => entry.day > state.lastSeenDay);
  if (state.lastSeenDay === null) {
    log(state, 'You wake up in a hut that smells of fresh paint. Walk into things to use them.');
  }
  for (const entry of newEntries) {
    log(state, `New on day ${entry.day}: ${entry.title}.`, 'new-tonight');
  }
  state.lastSeenDay = day;
  writeSave(key, state);
}

function setupChronicle() {
  const list = $('chronicle-list');
  const prefix = archivedDay ? '../' : 'day/';
  for (const entry of [...CHRONICLE].reverse()) {
    const li = document.createElement('li');
    const when = document.createElement('span');
    when.className = 'when';
    when.textContent = `Day ${entry.day}: ${entry.title}`;
    const text = document.createElement('span');
    text.textContent = `${entry.text} `;
    li.append(when, text);
    if (entry.day !== currentDay() || archivedDay) {
      const link = document.createElement('a');
      link.href = `${prefix}${pad3(entry.day)}/`;
      link.textContent = 'Play this version';
      li.append(link);
    }
    list.append(li);
  }
  $('open-chronicle').addEventListener('click', () => $('chronicle-dialog').showModal());
}

function setupInput() {
  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (document.querySelector('dialog[open]')) return;
    // Wer im Chat oder in einem Formular tippt, bewegt den Spieler nicht.
    if (event.target.closest?.('input, textarea, select, [contenteditable]')) return;
    if (document.body.classList.contains('chat-open')) return;
    const action = KEYS[event.key];
    if (!action) return;
    event.preventDefault();
    perform(action);
  });
  for (const button of document.querySelectorAll('[data-action]')) {
    button.addEventListener('click', () => perform(button.dataset.action));
  }
}

function setupArchiveNote() {
  if (!archivedDay) return;
  $('open-timelapse').href = '../../timelapse/';
  $('open-about').href = '../../about/';
  const note = $('archive-note');
  note.hidden = false;
  note.append(`You are visiting the past: this is the game as it was on day ${Number(archivedDay)}. `);
  const back = document.createElement('a');
  back.href = '../../';
  back.textContent = 'Back to today';
  note.append(back);
}

$('day-label').textContent = `Day ${currentDay()}`;
setupCrt((on) => { glow = on; draw(state); });
setupCountdown({ latestDate: CHRONICLE.at(-1).date, archived: Boolean(archivedDay) });
setupBoot({ day: currentDay(), title: CHRONICLE.at(-1).title });
setupTonight();
setupMenus();
setupChat({ archived: Boolean(archivedDay) });
if (CONTACT_EMAIL) {
  $('contact-email').href = `mailto:${CONTACT_EMAIL}`;
  $('contact-email-note').textContent = CONTACT_EMAIL;
  $('contact-email-row').hidden = false;
  $('contact-email-note').hidden = false;
}
setupLogToggle();
setupArchiveNote();
setupChronicle();
setupSuggestions({ archived: Boolean(archivedDay) });
setupVoting({ archived: Boolean(archivedDay) });
setupRating({ archived: Boolean(archivedDay) });
setupQuestLog();
setupWindows();
updateEvent = setupEvent({ archived: Boolean(archivedDay), getStat: (name) => state.stats[name], getFlags: () => state.flags });
setupInput();
greet();
refresh();
setupEchoes();
setupChatBubbles();

// Stabile Schnittstelle für die Tests. Nicht entfernen, nur erweitern.
window.__overnight = {
  get state() { return state; },
  day: currentDay(),
  act: perform,
  get echoes() { return presence; },
  chatBubble: (name = null) => chatOf(name),
};
