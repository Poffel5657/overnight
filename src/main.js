// Verbindet Spiellogik, Darstellung und Bedienung im Browser.
import { act, createGame, currentDay, log } from './game.js';
import { createRenderer } from './render.js';
import { loadSave, saveKey, writeSave } from './save.js';
import { setupSuggestions } from './suggest.js';
import { CHRONICLE } from '../content/chronicle.js';
import { ITEMS } from '../content/items.js';

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

const draw = createRenderer($('world'));

function refresh() {
  draw(state);
  const { hp, maxHp } = state.player;
  const weapon = ITEMS[state.player.weapon];
  $('hp-label').textContent = weapon ? `HP ${hp}/${maxHp} · ${weapon.name}` : `HP ${hp}/${maxHp}`;
  $('hp-bar').style.width = `${(hp / maxHp) * 100}%`;
  $('hp-bar').classList.toggle('low', hp <= maxHp * 0.3);
  $('log').replaceChildren(
    ...state.log.slice(-5).map(({ text, kind }) => {
      const li = document.createElement('li');
      li.textContent = text;
      if (kind) li.className = kind;
      return li;
    }),
  );
}

function perform(action) {
  act(state, action);
  writeSave(key, state);
  refresh();
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
  const note = $('archive-note');
  note.hidden = false;
  note.append(`You are visiting the past: this is the game as it was on day ${Number(archivedDay)}. `);
  const back = document.createElement('a');
  back.href = '../../';
  back.textContent = 'Back to today';
  note.append(back);
}

$('day-label').textContent = `Day ${currentDay()}`;
setupArchiveNote();
setupChronicle();
setupSuggestions({ archived: Boolean(archivedDay) });
setupInput();
greet();
refresh();

// Stabile Schnittstelle für die Tests. Nicht entfernen, nur erweitern.
window.__overnight = {
  get state() { return state; },
  day: currentDay(),
  act: perform,
};
