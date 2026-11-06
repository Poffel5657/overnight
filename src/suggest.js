// Vorschlagsformular und gemeinsames Captcha. Geschützte Datei: Nur hier und in vote.js gibt es Netzwerkzugriff.
import { SUGGEST_URL, TURNSTILE_SITE_KEY } from './config.js';

const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

const SENT_KEY = 'overnight.suggested';
const ALREADY_SENT = 'You already sent an idea tonight. The box opens again after midnight.';

export const berlinDay = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date());

function sentToday() {
  try {
    return localStorage.getItem(SENT_KEY) === berlinDay();
  } catch {
    return false;
  }
}

function markSent() {
  try {
    localStorage.setItem(SENT_KEY, berlinDay());
  } catch {
    // Ohne Speicher greift nur noch die Sperre im Worker.
  }
}

let turnstileScript = null;

function turnstileReady() {
  turnstileScript ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = TURNSTILE_SRC;
    script.onload = () => resolve(window.turnstile);
    script.onerror = () => {
      turnstileScript = null;
      reject(new Error('Turnstile nicht geladen'));
    };
    document.head.append(script);
  });
  return turnstileScript;
}

// Ein Captcha pro Dialog. Vorschlag und Abstimmung teilen sich das Skript, nicht das Widget.
export function createCaptcha(container) {
  let token = '';
  let widget = null;
  let requested = false;
  return {
    load() {
      if (requested || !TURNSTILE_SITE_KEY) return;
      requested = true;
      turnstileReady().then((turnstile) => {
        widget = turnstile.render(container, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: 'dark',
          callback: (value) => { token = value; },
          'expired-callback': () => { token = ''; },
        });
      }).catch(() => { requested = false; });
    },
    get missing() { return Boolean(TURNSTILE_SITE_KEY) && !token; },
    get token() { return token; },
    reset() {
      token = '';
      if (widget !== null) window.turnstile?.reset(widget);
    },
  };
}

export function setupSuggestions({ archived }) {
  const dialog = document.getElementById('suggest-dialog');
  const openArea = document.getElementById('suggest-open');
  const status = document.getElementById('suggest-status');
  const text = document.getElementById('suggest-text');
  const trap = document.getElementById('suggest-website');
  const send = document.getElementById('suggest-send');
  const opener = document.getElementById('open-suggest');
  const captcha = createCaptcha(document.getElementById('suggest-captcha'));

  if (archived) {
    opener.hidden = true;
    return;
  }

  opener.addEventListener('click', () => {
    if (SUGGEST_URL && sentToday()) {
      openArea.hidden = true;
      status.textContent = ALREADY_SENT;
    } else if (SUGGEST_URL) {
      openArea.hidden = false;
      status.textContent = '';
      captcha.load();
    } else {
      openArea.hidden = true;
      status.textContent = "The suggestion box isn't open yet. Check back soon.";
    }
    dialog.showModal();
  });

  send.addEventListener('click', async () => {
    const idea = text.value.trim();
    if (!idea) {
      status.textContent = 'Write an idea first.';
      return;
    }
    if (captcha.missing) {
      status.textContent = 'Please finish the check above first.';
      return;
    }
    send.disabled = true;
    status.textContent = 'Sending...';
    try {
      const response = await fetch(SUGGEST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: idea, website: trap.value, token: captcha.token }),
      });
      if (response.ok) {
        text.value = '';
        markSent();
        openArea.hidden = true;
        status.textContent = 'Thanks. The Nightwright has your idea.';
      } else if (response.status === 409) {
        markSent();
        openArea.hidden = true;
        status.textContent = ALREADY_SENT;
      } else if (response.status === 429) {
        status.textContent = 'Too many ideas right now. Try again later.';
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
