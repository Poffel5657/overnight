// Zeitraffer: eine Weltkarte pro Nacht, alle Gebiete nebeneinander. days.js mit den Welten aller
// Nächte erzeugt der Deploy (.github/scripts/timelapse-days.mjs), atlas.js zeichnet daraus.
import { DAYS } from './days.js';
import { layout, drawAtlas } from './atlas.js';

const $ = (id) => document.getElementById(id);
const pad3 = (n) => String(n).padStart(3, '0');
const slider = $('slider');
const canvas = $('atlas');
let index = DAYS.length - 1;
let timer = null;
// Breiteste Welt aller Nächte, in Feldern.
const maxCols = Math.max(1, ...DAYS.map((day) => (day.world ? layout(day.world).bounds.w : 1)));
let size = null;

// Gleiche Feldgröße in jeder Nacht: Die größte Welt füllt die Breite, kleinere sind entsprechend schmaler.
// Wird es zu klein zum Lesen (Handy), darf der Rahmen seitlich scrollen.
function fit() {
  if (!size) return;
  const room = canvas.parentElement.clientWidth - 16;
  const cell = Math.max(7, Math.min(22, room / maxCols));
  canvas.style.width = `${Math.round(size.cols * cell)}px`;
}

function show(i) {
  if (!DAYS.length) return;
  index = Math.max(0, Math.min(DAYS.length - 1, i));
  const day = DAYS[index];
  slider.value = String(index);
  $('caption-title').textContent = `Day ${day.day} · ${day.date} · ${day.title}`;
  $('caption-text').textContent = day.text;
  $('caption-play').href = `../day/${pad3(day.day)}/`;

  const world = day.world;
  if (!world) {
    canvas.hidden = true;
    return;
  }
  canvas.hidden = false;
  const styles = getComputedStyle(document.documentElement);
  size = drawAtlas(canvas, world, {
    before: DAYS[index - 1]?.world ?? null,
    accent: styles.getPropertyValue('--accent').trim() || undefined,
    muted: styles.getPropertyValue('--muted').trim() || undefined,
  });
  const names = Object.values(world.maps).map((map) => map.name).join(', ');
  canvas.setAttribute('aria-label', `The world on day ${day.day}: ${names}`);
  fit();
}

function stop() {
  clearInterval(timer);
  timer = null;
  $('play').textContent = 'Play';
}

function play() {
  if (timer) return stop();
  if (index >= DAYS.length - 1) show(0);
  $('play').textContent = 'Pause';
  timer = setInterval(() => {
    if (index >= DAYS.length - 1) return stop();
    show(index + 1);
  }, 1200);
}

if (!DAYS.length) {
  $('empty').hidden = false;
  document.querySelector('.frame').hidden = true;
  document.querySelector('.controls').hidden = true;
} else {
  slider.max = String(DAYS.length - 1);
  window.addEventListener('resize', fit);
  slider.addEventListener('input', () => { stop(); show(Number(slider.value)); });
  $('prev').addEventListener('click', () => { stop(); show(index - 1); });
  $('next').addEventListener('click', () => { stop(); show(index + 1); });
  $('play').addEventListener('click', play);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') { stop(); show(index - 1); }
    if (event.key === 'ArrowRight') { stop(); show(index + 1); }
    if (event.key === ' ') { event.preventDefault(); play(); }
  });
  show(index);
  // Die Gebietsnamen nutzen VT323: einmal neu zeichnen, sobald die Schrift geladen ist.
  document.fonts?.load('18px VT323').then(() => show(index), () => {});
}
