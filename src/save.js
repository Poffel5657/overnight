// Spielstände in localStorage. Alte Stände müssen immer weiter ladbar bleiben.
export const SAVE_VERSION = 1;

// MIGRATIONS[n] hebt einen Stand von Version n auf n + 1.
// Bei jeder Formatänderung: Eintrag ergänzen, SAVE_VERSION erhöhen, Fixture in tests/fixtures/ ablegen.
const MIGRATIONS = {};

// Zeitreise-Versionen unter /day/NNN/ teilen sich die Origin mit dem Live-Spiel und brauchen
// eigene Schlüssel, sonst würde eine alte Version den aktuellen Spielstand überschreiben.
export function saveKey(pathname = location.pathname) {
  const archived = pathname.match(/\/day\/(\d{3})\//);
  return archived ? `overnight.save.day${archived[1]}` : 'overnight.save';
}

export function migrate(data) {
  let current = data;
  while (current.version < SAVE_VERSION) {
    const step = MIGRATIONS[current.version];
    if (!step) throw new Error(`Keine Migration für Version ${current.version}`);
    current = { ...step(current), version: current.version + 1 };
  }
  return current;
}

export function loadSave(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (typeof data?.version !== 'number' || data.version > SAVE_VERSION) return null;
    if (typeof data.player?.x !== 'number' || typeof data.player?.y !== 'number') return null;
    return migrate(data);
  } catch {
    // Kaputter oder gesperrter Speicher darf das Spiel nie blockieren: dann eben neu anfangen.
    return null;
  }
}

export function writeSave(key, s) {
  const data = {
    version: SAVE_VERSION,
    map: s.map,
    player: s.player,
    turn: s.turn,
    flags: s.flags,
    stats: s.stats,
    lastSeenDay: s.lastSeenDay,
  };
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Ohne Speicher läuft das Spiel einfach ohne Fortschritt weiter.
  }
}
