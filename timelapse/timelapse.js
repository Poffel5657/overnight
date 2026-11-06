// Zeitraffer: ein Bild pro Nacht. days.js und shots/ erzeugt der Deploy (.github/scripts/timelapse.mjs).
import { DAYS } from './days.js';

const $ = (id) => document.getElementById(id);
const pad3 = (n) => String(n).padStart(3, '0');
const slider = $('slider');
let index = DAYS.length - 1;
let timer = null;

function show(i) {
  if (!DAYS.length) return;
  index = Math.max(0, Math.min(DAYS.length - 1, i));
  const day = DAYS[index];
  slider.value = String(index);
  $('shot').src = day.shot;
  $('shot').alt = `The world on day ${day.day}: ${day.title}`;
  $('caption-title').textContent = `Day ${day.day} · ${day.date} · ${day.title}`;
  $('caption-text').textContent = day.text;
  $('caption-play').href = `../day/${pad3(day.day)}/`;
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
  }, 900);
}

if (!DAYS.length) {
  $('empty').hidden = false;
  document.querySelector('.frame').hidden = true;
  document.querySelector('.controls').hidden = true;
} else {
  slider.max = String(DAYS.length - 1);
  // Bilder vorladen, damit das Abspielen nicht flackert.
  for (const day of DAYS) new Image().src = day.shot;
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
}
