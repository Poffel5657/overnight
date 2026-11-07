// Über-Seite: aktuelle Nacht und die letzten Einträge der Chronik, direkt aus content/chronicle.js.
import { CHRONICLE } from '../content/chronicle.js';

const latest = CHRONICLE.at(-1);
document.getElementById('about-day').textContent = `Night ${latest.day}`;
document.getElementById('about-recent').replaceChildren(...CHRONICLE.slice(-4).reverse().map((entry) => {
  const li = document.createElement('li');
  const when = document.createElement('span');
  when.className = 'when';
  when.textContent = `Night ${entry.day}: ${entry.title}`;
  const text = document.createElement('span');
  text.textContent = entry.text;
  li.append(when, text);
  return li;
}));
