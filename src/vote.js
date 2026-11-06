// Abstimmung über den Stimmzettel. Geschützte Datei: Neben suggest.js der einzige Ort mit Netzwerkzugriff.
import { SUGGEST_URL } from './config.js';
import { berlinDay, createCaptcha } from './suggest.js';
import { BALLOT } from '../content/ballot.js';

const VOTED_KEY = 'overnight.voted';
const ALREADY_VOTED = 'You already voted tonight. The Nightwright counts at midnight.';

function votedToday() {
  try {
    return localStorage.getItem(VOTED_KEY) === berlinDay();
  } catch {
    return false;
  }
}

function markVoted() {
  try {
    localStorage.setItem(VOTED_KEY, berlinDay());
  } catch {
    // Ohne Speicher greift nur noch die Sperre im Worker.
  }
}

function buildOptions(list) {
  list.append(...BALLOT.options.map((option, index) => {
    const label = document.createElement('label');
    label.className = 'vote-option';
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'vote-choice';
    radio.value = option.id;
    radio.id = `vote-${index}`;
    const text = document.createElement('span');
    text.textContent = option.text;
    label.append(radio, text);
    return label;
  }));
}

export function setupVoting({ archived }) {
  const dialog = document.getElementById('vote-dialog');
  const openArea = document.getElementById('vote-open');
  const status = document.getElementById('vote-status');
  const list = document.getElementById('vote-options');
  const trap = document.getElementById('vote-website');
  const send = document.getElementById('vote-send');
  const opener = document.getElementById('open-vote');

  if (archived || !BALLOT?.options?.length) {
    opener.hidden = true;
    return;
  }
  buildOptions(list);
  const captcha = createCaptcha(document.getElementById('vote-captcha'));

  opener.addEventListener('click', () => {
    if (SUGGEST_URL && votedToday()) {
      openArea.hidden = true;
      status.textContent = ALREADY_VOTED;
    } else if (SUGGEST_URL) {
      openArea.hidden = false;
      status.textContent = '';
      captcha.load();
    } else {
      openArea.hidden = true;
      status.textContent = "The ballot box isn't open yet. Check back soon.";
    }
    dialog.showModal();
  });

  send.addEventListener('click', async () => {
    const choice = list.querySelector('input:checked')?.value;
    if (!choice) {
      status.textContent = 'Pick one idea first.';
      return;
    }
    if (captcha.missing) {
      status.textContent = 'Please finish the check above first.';
      return;
    }
    send.disabled = true;
    status.textContent = 'Sending...';
    try {
      const response = await fetch(new URL('vote', SUGGEST_URL), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ballot: BALLOT.day, choice, website: trap.value, token: captcha.token }),
      });
      if (response.ok) {
        markVoted();
        openArea.hidden = true;
        status.textContent = 'Thanks. Your vote is in the box.';
      } else if (response.status === 409) {
        markVoted();
        openArea.hidden = true;
        status.textContent = ALREADY_VOTED;
      } else if (response.status === 429) {
        status.textContent = 'Too many votes right now. Try again later.';
      } else {
        status.textContent = "That didn't work. Try again later.";
      }
    } catch {
      status.textContent = "That didn't work. Try again later.";
    } finally {
      send.disabled = false;
      captcha.reset();
    }
  });
}
