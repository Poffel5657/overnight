// Verbindet Spiellogik, Darstellung und Bedienung im Browser.
import {
  act, attackOf, countItem, createGame, currentDay, defenseOf, equip, log, nextLevelXp, questState, ARMOR_SLOTS,
  applyWorld, leaveWorld, rewardKill, takeBite,
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

const KEYS = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  w: 'up', s: 'down', a: 'left', d: 'right', ' ': 'wait',
};
// Tasten, die ein Fenster öffnen statt einen Zug zu machen.
const WINDOW_KEYS = { i: 'gear-dialog', g: 'gear-dialog' };

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
let presence = { here: () => [], bubbleOf: () => null, total: () => 0, moved() {}, emote() {}, send() {}, myId: () => null, active: false };
const draw = createRenderer($('world'), {
  glow: () => glow,
  marker: !archivedDay,
  echoes: () => ({ list: presence.here(), bubbleOf: presence.bubbleOf, color: PRESENCE.color, chatOf }),
});

const HP_CELLS = 14;

function chip(kind, name) {
  const span = document.createElement('span');
  span.className = 'chip';
  const label = document.createElement('span');
  label.className = 'chip-kind';
  label.textContent = `${kind} `;
  span.append(label, name);
  return span;
}

function drawHud() {
  const { hp, maxHp } = state.player;
  const weapon = ITEMS[state.player.weapon];
  // Gleiche Dinge im Beutel werden gezählt: "button x3".
  const counts = new Map();
  for (const id of state.player.bag) counts.set(id, (counts.get(id) ?? 0) + 1);
  const bag = [...counts].map(([id, n]) => (n > 1 ? `${ITEMS[id].name} x${n}` : ITEMS[id].name));
  const { level, xp } = state.player;
  const next = nextLevelXp(state);
  const xpText = `${level} · XP ${xp}${next === null ? '' : `/${next}`}`;
  // Voller Text für Screenreader und Tests, die sichtbare Anzeige steht daneben.
  const def = defenseOf(state);
  const parts = [MAPS[state.map].name, `HP ${hp}/${maxHp}`, `LV ${xpText}`];
  if (weapon) parts.push(weapon.name);
  if (def) parts.push(`defence ${def}`);
  if (bag.length) parts.push(`bag: ${bag.join(', ')}`);
  $('hp-label').textContent = parts.join(' · ');
  $('map-name').textContent = MAPS[state.map].name;

  const filled = Math.round((hp / maxHp) * HP_CELLS);
  $('hp-meter').textContent = `HP [${'█'.repeat(filled)}${'·'.repeat(HP_CELLS - filled)}] ${hp}/${maxHp}`;
  $('hp-meter').classList.toggle('low', hp <= maxHp * 0.3);
  $('items').replaceChildren(
    chip('LV', xpText),
    ...(weapon ? [chip('WPN', weapon.name)] : []),
    ...(def ? [chip('DEF', String(def))] : []),
    ...bag.map((name) => chip('BAG', name)),
  );
}

// Fenster [ GEAR ] (seit Tag 5): Werte, was man trägt, und der Beutel mit Knöpfen zum Anlegen.
const SLOT_LABELS = { weapon: 'WPN', head: 'HEAD', body: 'BODY', feet: 'FEET' };

function gearRow(label, id, action) {
  const row = document.createElement('li');
  row.className = 'gear-row';
  const kind = document.createElement('span');
  kind.className = 'gear-kind';
  kind.textContent = label;
  const name = document.createElement('span');
  name.className = 'gear-name';
  const item = ITEMS[id];
  name.textContent = item ? item.name : '—';
  const stat = item?.atk !== undefined ? ` +${item.atk} ATK` : item?.def ? ` +${item.def} DEF` : '';
  if (stat) {
    const bonus = document.createElement('span');
    bonus.className = 'gear-bonus';
    bonus.textContent = stat;
    name.append(bonus);
  }
  row.append(kind, name);
  if (action) row.append(action);
  if (item?.text) {
    const text = document.createElement('span');
    text.className = 'gear-text';
    text.textContent = item.text;
    row.append(text);
  }
  return row;
}

function drawGear() {
  const p = state.player;
  const next = nextLevelXp(state);
  $('gear-stats').textContent = [
    `LV ${p.level}`, `XP ${p.xp}${next === null ? '' : `/${next}`}`, `HP ${p.hp}/${p.maxHp}`,
    `ATK ${attackOf(state)}`, `DEF ${defenseOf(state)}`,
  ].join('   ');
  $('gear-worn').replaceChildren(
    gearRow(SLOT_LABELS.weapon, p.weapon),
    ...ARMOR_SLOTS.map((slot) => gearRow(SLOT_LABELS[slot], p.armor[slot])),
  );
  const counts = new Map();
  for (const id of p.bag) counts.set(id, (counts.get(id) ?? 0) + 1);
  const rows = [...counts].map(([id, n]) => {
    const item = ITEMS[id];
    let button = null;
    if (item.atk !== undefined || item.slot) {
      button = document.createElement('button');
      button.className = 'gear-equip';
      button.textContent = item.slot ? 'Wear' : 'Wield';
      button.addEventListener('click', () => {
        equip(state, id);
        writeSave(key, state);
        refresh();
        drawGear();
      });
    }
    return gearRow(n > 1 ? `x${n}` : 'BAG', id, button);
  });
  $('gear-bag').replaceChildren(...rows);
  $('gear-empty').hidden = rows.length > 0;
}

function setupGear() {
  const open = () => {
    drawGear();
    $('gear-dialog').showModal();
  };
  $('open-gear').addEventListener('click', open);
  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey || document.querySelector('dialog[open]')) return;
    if (event.target.closest?.('input, textarea, select, [contenteditable]')) return;
    if (document.body.classList.contains('chat-open')) return;
    if (WINDOW_KEYS[event.key] !== 'gear-dialog') return;
    event.preventDefault();
    open();
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
  updateQuests(QUESTS, (id) => questState(state, id), (item) => countItem(state, item));
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

// In der gemeinsamen Welt läuft die Zeit von selbst; mehr als ein Zug pro ACTION_GAP_MS geht nicht.
const ACTION_GAP_MS = 110;
let lastAction = 0;

function perform(action) {
  if (state.shared) {
    const now = Date.now();
    if (now - lastAction < ACTION_GAP_MS) return;
    lastAction = now;
  }
  act(state, action);
  writeSave(key, state);
  refresh();
  updateEvent();
  presence.moved();
  if (state.outbox?.length) presence.send(state.outbox.splice(0));
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
    emotes: PRESENCE.emotes,
    getPosition: () => ({ map: state.map, x: state.player.x, y: state.player.y }),
    knownMap: (id) => Object.hasOwn(MAPS, id),
    onChange: () => {
      draw(state);
      drawEchoCount();
    },
    onEmote: (peer, emote) => {
      log(state, `${peer.name} ${emote.verb}.`, 'echo');
      drawLog();
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
  if (!presence.active) return;
  const box = $('emotes');
  for (const emote of PRESENCE.emotes) {
    const button = document.createElement('button');
    button.textContent = emote.button;
    button.dataset.emote = emote.id;
    button.addEventListener('click', () => doEmote(emote));
    box.append(button);
  }
  box.hidden = false;
  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey || document.querySelector('dialog[open]')) return;
    if (event.target.closest?.('input, textarea, select, [contenteditable]')) return;
    if (document.body.classList.contains('chat-open')) return;
    const emote = PRESENCE.emotes.find((e) => e.key === event.key);
    if (!emote) return;
    event.preventDefault();
    doEmote(emote);
  });
  drawEchoCount();
}

function doEmote(emote) {
  if (!presence.emote(emote.id)) return;
  log(state, `You ${emote.verb.replace(/s$/, '')}.`, 'echo');
  drawLog();
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
setupGear();
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
