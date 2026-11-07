// Quest-Log: kleiner Tracker oben rechts über der Karte, wie man ihn aus MMOs kennt.
// Jeder Eintrag ist ein <li class="quest"> in #quest-list. Wer einen Eintrag ein- oder ausblendet
// (heute das Event, später Quests), ruft danach refreshQuestLog() auf. Ohne sichtbaren Eintrag
// verschwindet das ganze Log. Einträge sind kompakt: Titel und Fortschritt immer, Beschreibung
// (.quest-text) und Kleingedrucktes (.quest-fine) erst nach einem Klick auf den Eintrag.
const KEY = 'overnight.quest-log';

const $ = (id) => document.getElementById(id);

function read() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function setOpen(open) {
  $('quest-toggle').setAttribute('aria-expanded', String(open));
  $('quest-list').hidden = !open;
  const count = [...$('quest-list').children].filter((li) => !li.hidden).length;
  $('quest-toggle').textContent = open ? 'QUESTS ▾' : `QUESTS: ${count} ▸`;
}

export function refreshQuestLog() {
  const log = $('quest-log');
  if (!log) return;
  const visible = [...$('quest-list').children].some((li) => !li.hidden);
  log.hidden = !visible;
  setOpen($('quest-toggle').getAttribute('aria-expanded') === 'true');
}

export function setupQuestLog() {
  const toggle = $('quest-toggle');
  if (!toggle) return;
  // Gemerkte Wahl; sonst am Handy zugeklappt, damit die kleine Karte frei bleibt.
  const saved = read();
  const open = saved ? saved === 'open' : window.innerWidth >= 600;
  setOpen(open);
  $('quest-list').addEventListener('click', (event) => {
    const quest = event.target.closest('.quest');
    if (quest) quest.classList.toggle('open');
  });
  toggle.addEventListener('click', () => {
    const next = toggle.getAttribute('aria-expanded') !== 'true';
    setOpen(next);
    try { localStorage.setItem(KEY, next ? 'open' : 'closed'); } catch { /* nur Bequemlichkeit */ }
  });
  refreshQuestLog();
}

// Quests aus content/quests.js (seit Tag 5): Jede angenommene, offene Quest bekommt einen Eintrag
// mit Titel, Fortschritt und Aufgabe. Wird nach jedem Zug aufgerufen.
const questItems = new Map();

function questItem(quest) {
  if (questItems.has(quest.id)) return questItems.get(quest.id);
  const li = document.createElement('li');
  li.className = 'quest quest-entry';
  li.dataset.quest = quest.id;
  const title = document.createElement('p');
  title.className = 'quest-title';
  const label = document.createElement('span');
  label.className = 'quest-label';
  label.textContent = 'QUEST';
  title.append(label, ` ${quest.title}`);
  const progress = document.createElement('p');
  progress.className = 'quest-progress';
  const text = document.createElement('p');
  text.className = 'quest-text';
  text.textContent = quest.task;
  li.append(title, progress, text);
  $('quest-list').append(li);
  questItems.set(quest.id, li);
  return li;
}

// quests: Liste aus content/quests.js. stateOf(id) = 'active' | 'done' | null, have(item) = Anzahl.
export function updateQuests(quests, stateOf, have) {
  if (!$('quest-list')) return;
  let changed = false;
  for (const quest of quests) {
    const active = stateOf(quest.id) === 'active';
    if (!active && !questItems.has(quest.id)) continue;
    const li = questItem(quest);
    if (li.hidden === active) changed = true;
    li.hidden = !active;
    const n = Math.min(have(quest.item), quest.count);
    li.querySelector('.quest-progress').textContent = `${quest.progressLabel} ${n}/${quest.count}${n >= quest.count ? ` · ${quest.returnText}` : ''}`;
  }
  if (changed) refreshQuestLog();
}
