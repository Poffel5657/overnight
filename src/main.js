// Verbindet Spiellogik, Darstellung und Bedienung im Browser.
import { act, createGame, currentDay, log, nextLevelXp } from './game.js';
import { createRenderer } from './render.js';
import { loadSave, saveKey, writeSave } from './save.js';
import { setupSuggestions } from './suggest.js';
import { setupVoting } from './vote.js';
import { setupEvent } from './event.js';
import { setupRating } from './rate.js';
import { setupChat } from './chat.js';
import { CONTACT_EMAIL } from './config.js';
import { crtEnabled, reducedMotion, setupBoot, setupCountdown, setupCrt } from './terminal.js';
import { CHRONICLE } from '../content/chronicle.js';
import { ITEMS } from '../content/items.js';
import { MAPS } from '../content/world.js';
import { BALLOT } from '../content/ballot.js';

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
const draw = createRenderer($('world'), { glow: () => glow });

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
  const parts = [MAPS[state.map].name, `HP ${hp}/${maxHp}`, `LV ${xpText}`];
  if (weapon) parts.push(weapon.name);
  if (bag.length) parts.push(`bag: ${bag.join(', ')}`);
  $('hp-label').textContent = parts.join(' · ');
  $('map-name').textContent = MAPS[state.map].name;

  const filled = Math.round((hp / maxHp) * HP_CELLS);
  $('hp-meter').textContent = `HP [${'█'.repeat(filled)}${'·'.repeat(HP_CELLS - filled)}] ${hp}/${maxHp}`;
  $('hp-meter').classList.toggle('low', hp <= maxHp * 0.3);
  $('items').replaceChildren(
    chip('LV', xpText),
    ...(weapon ? [chip('WPN', weapon.name)] : []),
    ...bag.map((name) => chip('BAG', name)),
  );
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

function perform(action) {
  act(state, action);
  writeSave(key, state);
  refresh();
  updateEvent();
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
updateEvent = setupEvent({ archived: Boolean(archivedDay), getStat: (name) => state.stats[name], getFlags: () => state.flags });
setupInput();
greet();
refresh();

// Stabile Schnittstelle für die Tests. Nicht entfernen, nur erweitern.
window.__overnight = {
  get state() { return state; },
  day: currentDay(),
  act: perform,
};
