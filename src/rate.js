// Bewertung der Neuerungen einer Nacht. Geschützte Datei: Netzwerkzugriff wie suggest.js und vote.js.
// Eine Bewertung pro Nacht und Person, ein Klick, kein Captcha. Der Nachtlauf liest die Ergebnisse.
import { SUGGEST_URL } from './config.js';
import { currentDay } from './game.js';

const KEY = 'overnight.rated';

function ratedDay() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function markRated(day) {
  try {
    localStorage.setItem(KEY, String(day));
  } catch {
    // Ohne Speicher greift nur noch die Sperre im Worker.
  }
}

export function setupRating({ archived }) {
  const box = document.getElementById('rate-box');
  const day = currentDay();
  if (archived || !SUGGEST_URL || day < 1 || ratedDay() === String(day)) {
    box.hidden = true;
    return;
  }
  const status = document.getElementById('rate-status');
  const buttons = [...box.querySelectorAll('[data-rate]')];
  document.getElementById('rate-question').textContent = `How was night ${day}?`;
  box.hidden = false;

  const finish = (text) => {
    for (const button of buttons) button.hidden = true;
    status.textContent = text;
  };

  for (const button of buttons) {
    button.addEventListener('click', async () => {
      for (const other of buttons) other.disabled = true;
      try {
        const response = await fetch(new URL('rate', SUGGEST_URL), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ day, value: button.dataset.rate }),
        });
        if (response.ok || response.status === 409) {
          markRated(day);
          finish('Thanks. The Nightwright reads every one.');
          return;
        }
        status.textContent = "That didn't work. Try again later.";
      } catch {
        status.textContent = "That didn't work. Try again later.";
      }
      for (const other of buttons) other.disabled = false;
    });
  }
}
