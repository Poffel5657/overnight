// Community-Event. Geschützte Datei: Neben suggest.js und vote.js der einzige Ort mit Netzwerkzugriff.
// Jeder Spieler kann pro Nacht einmal beitragen: Sobald die Statistik heute um `need` gewachsen ist,
// meldet das Spiel das von selbst an den Worker. Der Zählerstand dort ist nur Anzeige.
import { SUGGEST_URL } from './config.js';
import { berlinDay } from './suggest.js';
import { currentDay } from './game.js';
import { EVENT } from '../content/event.js';

const KEY = 'overnight.event';

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(KEY));
  } catch {
    return null;
  }
}

function writeLocal(value) {
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // Ohne Speicher zählt der Beitrag trotzdem, nur der Fortschritt geht beim Neuladen verloren.
  }
}

export const eventActive = (day = currentDay()) =>
  Boolean(EVENT) && day >= EVENT.startDay && day <= EVENT.endDay;

export function setupEvent({ archived, getStat }) {
  const box = document.getElementById('event-box');
  if (archived || !eventActive()) {
    box.hidden = true;
    return () => {};
  }
  box.hidden = false;
  const $ = (id) => document.getElementById(id);
  $('event-title').textContent = EVENT.title;
  $('event-text').textContent = `${EVENT.text} ${EVENT.task}`;
  $('event-reward').textContent = EVENT.reward;

  let total = null;
  let sending = false;
  let local = null;

  function progress() {
    const today = berlinDay();
    const value = Number(getStat(EVENT.stat)) || 0;
    local = readLocal();
    if (!local || local.id !== EVENT.id || local.day !== today) {
      local = { id: EVENT.id, day: today, base: value, sent: false };
      writeLocal(local);
    } else if (value < local.base) {
      // Neuer Spielstand: Fortschritt von hier an zählen.
      local.base = value;
      writeLocal(local);
    }
    return Math.max(0, value - local.base);
  }

  function draw(done) {
    const together = total === null ? '…' : total;
    const left = EVENT.endDay - currentDay();
    const when = left === 0 ? 'Last day.' : `${left + 1} days left.`;
    $('event-together').textContent = `Together: ${together} / ${EVENT.goal}. ${when}`;
    $('event-mine').textContent = local.sent
      ? 'Your part is done for today. Thank you.'
      : `Your part today: ${Math.min(done, EVENT.need)} / ${EVENT.need}`;
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
    const done = progress();
    if (SUGGEST_URL && !local.sent && !sending && done >= EVENT.need) contribute();
    draw(done);
  }

  update();
  if (SUGGEST_URL) loadTotal();
  return update;
}
