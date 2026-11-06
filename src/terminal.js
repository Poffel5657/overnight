// Terminal-Stimmung: Bootsequenz, Countdown bis zur nächsten Nacht und CRT-Schalter. Kein Netzwerk.
// Alles hier ist Dekoration: Nichts darf Eingaben abfangen oder das Spiel verzögern.
import { berlinDay } from './suggest.js';

const CRT_KEY = 'overnight.crt';
const BOOT_KEY = 'overnight.booted';
const $ = (id) => document.getElementById(id);
const pad2 = (n) => String(n).padStart(2, '0');
const pad3 = (n) => String(n).padStart(3, '0');

export const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

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
    // Ohne Speicher gilt nur die Voreinstellung.
  }
}

export const crtEnabled = () => read(CRT_KEY) !== 'off';

export function setupCrt(onChange = () => {}) {
  const button = $('crt-toggle');
  const apply = (on) => {
    document.documentElement.classList.toggle('crt-on', on);
    button.textContent = `CRT: ${on ? 'ON' : 'OFF'}`;
    button.setAttribute('aria-pressed', String(on));
    onChange(on);
  };
  apply(crtEnabled());
  button.addEventListener('click', () => {
    const on = !crtEnabled();
    write(CRT_KEY, on ? 'on' : 'off');
    apply(on);
  });
}

// Sekunden bis Mitternacht in Berlin, unabhängig von der Zeitzone des Geräts.
export function secondsToMidnight(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    }).formatToParts(now).map(({ type, value }) => [type, value]),
  );
  return 86400 - (Number(parts.hour) * 3600 + Number(parts.minute) * 60 + Number(parts.second));
}

export const formatClock = (seconds) =>
  `${pad2(Math.floor(seconds / 3600))}:${pad2(Math.floor((seconds % 3600) / 60))}:${pad2(seconds % 60)}`;

export function setupCountdown({ latestDate, archived }) {
  const label = $('countdown-label');
  const clock = $('countdown');
  const tick = () => {
    if (!archived && latestDate !== berlinDay()) {
      // Mitternacht ist vorbei, die neue Nacht ist aber noch nicht geladen.
      label.textContent = 'THE NIGHTWRIGHT IS AT WORK';
      clock.textContent = '';
      return;
    }
    label.textContent = 'NEXT BUILD';
    clock.textContent = formatClock(secondsToMidnight());
  };
  tick();
  setInterval(tick, 1000);
}

export function setupBoot({ day, title }) {
  const box = $('boot');
  const today = berlinDay();
  if (reducedMotion() || read(BOOT_KEY) === today) return;
  write(BOOT_KEY, today);

  const lines = [
    `OVERNIGHT TERMINAL  build ${pad3(day)}`,
    '(c) the Nightwright, probably',
    '',
    'checking memory ......... OK',
    'loading world ........... OK',
    `tonight: ${title}`,
    '',
    'ready.',
  ];
  const text = $('boot-text');
  box.hidden = false;
  let shown = 0;
  const timers = [];
  const finish = () => {
    timers.forEach(clearTimeout);
    window.removeEventListener('keydown', finish, true);
    window.removeEventListener('pointerdown', finish, true);
    box.classList.add('done');
    setTimeout(() => { box.hidden = true; }, 450);
  };
  // Jede Eingabe beendet den Boot sofort und geht trotzdem ans Spiel weiter.
  window.addEventListener('keydown', finish, true);
  window.addEventListener('pointerdown', finish, true);
  lines.forEach((line, index) => {
    timers.push(setTimeout(() => {
      shown += 1;
      text.textContent = lines.slice(0, shown).join('\n');
    }, index * 110));
  });
  timers.push(setTimeout(finish, lines.length * 110 + 350));
}
