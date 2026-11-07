// Community-Event. Geschützte Datei: Netzwerkzugriff wie suggest.js.
// Ein Event beginnt bei einer Figur (EVENT.giver): Bis man mit ihr gesprochen hat, zeigt die Anzeige nur
// einen Hinweis, wohin man gehen soll, und den Stand der Gemeinschaft. Danach die Aufgabe.
// Jeder Spieler kann pro Nacht einmal beitragen: Sobald die Statistik seit dem Gespräch bzw. seit Tagesbeginn
// um `need` gewachsen ist, meldet das Spiel das von selbst an den Worker. Der Zählerstand dort ist nur Anzeige.
import { SUGGEST_URL } from './config.js';
import { berlinDay } from './suggest.js';
import { activeEvent, currentDay } from './game.js';
import { EVENT } from '../content/event.js';
import { MAPS } from '../content/world.js';

const KEY = 'overnight.event';
const TOAST_KEY = 'overnight.event-toast';

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(KEY));
  } catch {
    return null;
  }
}

// Kurzer Hinweis beim Laden, einmal pro Event und Browser, solange man die Figur noch nicht kennt:
// Spieler haben die Event-Leiste allein oft übersehen.
function showToast(giver, heard) {
  const toast = document.getElementById('event-toast');
  let seen = null;
  try { seen = localStorage.getItem(TOAST_KEY); } catch { /* ohne Speicher eben bei jedem Laden */ }
  if (!toast || heard() || seen === EVENT.id) return () => {};
  let timer = null;
  const hide = () => {
    clearTimeout(timer);
    toast.hidden = true;
    try { localStorage.setItem(TOAST_KEY, EVENT.id); } catch { /* siehe oben */ }
  };
  document.getElementById('event-toast-text').textContent =
    `${EVENT.title}. Something is going on in ${giver.place}. Find ${giver.name} (marked with ! on the map) to learn more.`;
  document.getElementById('event-toast-close').addEventListener('click', hide);
  // Erst nach der Bootsequenz zeigen, sonst liegt der Hinweis darunter.
  const boot = document.getElementById('boot');
  const open = () => {
    if (boot && !boot.hidden) return setTimeout(open, 250);
    toast.hidden = false;
    timer = setTimeout(hide, 15000);
  };
  setTimeout(open, 400);
  return hide;
}

function writeLocal(value) {
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // Ohne Speicher zählt der Beitrag trotzdem, nur der Fortschritt geht beim Neuladen verloren.
  }
}

export const eventActive = (day = currentDay()) => Boolean(activeEvent(day));

// Wer leitet das Event, und wo steht er?
function findGiver() {
  for (const map of Object.values(MAPS)) {
    const entity = map.entities.find((e) => e.id === EVENT.giver);
    if (entity) return { name: entity.name, place: map.name };
  }
  return { name: 'someone', place: 'the world' };
}

export function setupEvent({ archived, getStat, getFlags = () => ({}) }) {
  const box = document.getElementById('event-box');
  if (archived || !eventActive()) {
    box.hidden = true;
    return () => {};
  }
  box.hidden = false;
  const $ = (id) => document.getElementById(id);
  const giver = findGiver();
  const heard = () => Boolean(getFlags()?.eventsHeard?.[EVENT.id]);

  let total = null;
  let sending = false;
  let local = null;
  const hideToast = showToast(giver, heard);

  function progress() {
    const today = berlinDay();
    const value = Number(getStat(EVENT.stat)) || 0;
    local = readLocal();
    // Vor dem Gespräch zählt noch nichts: Die Aufgabe beginnt, wenn man sie kennt.
    if (!heard() || !local || local.id !== EVENT.id || local.day !== today) {
      local = { id: EVENT.id, day: today, base: value, sent: local?.id === EVENT.id && local.day === today && local.sent };
      writeLocal(local);
    } else if (value < local.base) {
      // Neuer Spielstand: Fortschritt von hier an zählen.
      local.base = value;
      writeLocal(local);
    }
    return Math.max(0, value - local.base);
  }

  function draw(done) {
    const left = EVENT.endDay - currentDay();
    const when = left === 0 ? 'Last day.' : `${left + 1} days left.`;
    let together;
    if (total === null) together = `Together: … of ${EVENT.goal} parts done.`;
    else if (total >= EVENT.goal) together = `Together: ${total} of ${EVENT.goal} parts done. Goal reached!`;
    else together = `Together: ${total} of ${EVENT.goal} parts done, ${EVENT.goal - total} more needed.`;
    $('event-together').textContent = `${together} ${when}`;

    if (!heard()) {
      // Nur ein Hinweis: Wer mehr wissen will, geht hin und redet.
      $('event-title').textContent = `Something is going on in ${giver.place}.`;
      $('event-text').textContent = `Talk to ${giver.name} to learn more.`;
      $('event-mine').textContent = '';
      $('event-reward').textContent = '';
      box.classList.add('teaser');
      return;
    }
    box.classList.remove('teaser');
    $('event-title').textContent = EVENT.title;
    $('event-text').textContent = EVENT.text;
    $('event-reward').textContent = `${EVENT.reward} Each player can add one part per day.`;
    $('event-mine').textContent = local.sent
      ? 'Your part is done for today. Thank you.'
      : `Your part today: ${EVENT.task} (${Math.min(done, EVENT.need)} / ${EVENT.need})`;
  }

  async function contribute() {
    sending = true;
    try {
      const response = await fetch(new URL('event', SUGGEST_URL), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: EVENT.id }),
      });
      if (response.ok || response.status === 409) {
        local.sent = true;
        writeLocal(local);
        if (response.ok && total !== null) total += 1;
      }
    } catch {
      // Beim nächsten Zug noch einmal versuchen.
    } finally {
      sending = false;
      draw(progress());
    }
  }

  async function loadTotal() {
    try {
      const response = await fetch(new URL(`event?id=${EVENT.id}`, SUGGEST_URL));
      if (response.ok) total = Number((await response.json()).count) || 0;
    } catch {
      // Ohne Zählerstand zeigt die Anzeige nur Punkte.
    }
    draw(progress());
  }

  function update() {
    if (heard()) hideToast();
    const done = progress();
    if (SUGGEST_URL && heard() && !local.sent && !sending && done >= EVENT.need) contribute();
    draw(done);
  }

  update();
  if (SUGGEST_URL) loadTotal();
  return update;
}
