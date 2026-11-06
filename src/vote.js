// Abstimmung über den Stimmzettel. Geschützte Datei: Netzwerkzugriff wie suggest.js.
// Nach der eigenen Stimme zeigt der Dialog den Zwischenstand, vorher nicht, damit niemand
// nur der Mehrheit folgt. Das Ergebnis der letzten Abstimmung trägt der Nachtlauf in BALLOT.lastResult ein.
import { SUGGEST_URL } from './config.js';
import { berlinDay, createCaptcha } from './suggest.js';
import { BALLOT } from '../content/ballot.js';

const VOTED_KEY = 'overnight.voted';
const CHOICE_KEY = 'overnight.votedChoice';
const ALREADY_VOTED = 'You already voted tonight. The Nightwright counts at midnight.';
const BAR_CELLS = 16;

function read(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ohne Speicher greift nur noch die Sperre im Worker.
  }
}

const votedToday = () => read(VOTED_KEY) === berlinDay();

// Eigene Wahl merken, aber nur für diesen Stimmzettel.
function myChoice() {
  const [ballot, choice] = (read(CHOICE_KEY) ?? '').split('|');
  return Number(ballot) === BALLOT.day ? choice : null;
}

function markVoted(choice) {
  write(VOTED_KEY, berlinDay());
  if (choice) write(CHOICE_KEY, `${BALLOT.day}|${choice}`);
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

// Eine Zeile mit Balken aus Zeichen: Text, dann [██████······] 4 · 57%.
export function tallyRows(rows) {
  const total = rows.reduce((sum, row) => sum + row.votes, 0);
  return rows.map(({ text, votes, mark }) => {
    const share = total ? votes / total : 0;
    const filled = Math.round(share * BAR_CELLS);
    const li = document.createElement('li');
    const label = document.createElement('span');
    label.className = 'tally-text';
    label.textContent = mark ? `${text} ${mark}` : text;
    const bar = document.createElement('span');
    bar.className = 'tally-bar';
    bar.textContent = `[${'█'.repeat(filled)}${'·'.repeat(BAR_CELLS - filled)}] ${votes} · ${Math.round(share * 100)}%`;
    li.append(label, bar);
    return li;
  });
}

function showLastResult() {
  const result = BALLOT.lastResult;
  const box = document.getElementById('vote-last');
  if (!result?.options?.length) {
    box.hidden = true;
    return;
  }
  const total = result.options.reduce((sum, option) => sum + option.votes, 0);
  document.getElementById('vote-last-title').textContent =
    `Last vote (night ${result.ballot}): ${total} ${total === 1 ? 'vote' : 'votes'}`;
  document.getElementById('vote-last-list').replaceChildren(...tallyRows(
    [...result.options]
      .sort((a, b) => b.votes - a.votes)
      .map((option) => ({ ...option, mark: option.won ? '★ built' : '' })),
  ));
  box.hidden = false;
}

async function showLiveTally() {
  const box = document.getElementById('vote-results');
  const title = document.getElementById('vote-results-title');
  const list = document.getElementById('vote-results-list');
  box.hidden = false;
  title.textContent = 'Votes so far: counting…';
  list.replaceChildren();
  try {
    const response = await fetch(new URL(`vote?ballot=${BALLOT.day}`, SUGGEST_URL));
    if (!response.ok) throw new Error(String(response.status));
    const counts = (await response.json()).counts ?? {};
    const mine = myChoice();
    const rows = BALLOT.options
      .map((option) => ({
        text: option.text,
        votes: Number(counts[option.id]) || 0,
        mark: option.id === mine ? '◄ you' : '',
      }))
      .sort((a, b) => b.votes - a.votes);
    const total = rows.reduce((sum, row) => sum + row.votes, 0);
    title.textContent = `Votes so far: ${total}. Counted for real at midnight.`;
    list.replaceChildren(...tallyRows(rows));
  } catch {
    title.textContent = "Couldn't load the votes so far. Try again later.";
  }
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
  showLastResult();
  const captcha = createCaptcha(document.getElementById('vote-captcha'));

  opener.addEventListener('click', () => {
    document.getElementById('vote-results').hidden = true;
    if (SUGGEST_URL && votedToday()) {
      openArea.hidden = true;
      status.textContent = ALREADY_VOTED;
      showLiveTally();
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
        markVoted(choice);
        openArea.hidden = true;
        status.textContent = 'Thanks. Your vote is in the box.';
        showLiveTally();
      } else if (response.status === 409) {
        markVoted(null);
        openArea.hidden = true;
        status.textContent = ALREADY_VOTED;
        showLiveTally();
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
