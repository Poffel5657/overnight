// Stufen (seit Tag 4). LEVELS[n - 1] beschreibt Stufe n: xp = so viel Erfahrung braucht es insgesamt,
// maxHp und atk = so viel kommt beim Aufstieg dazu. Die letzte Stufe ist das Ende der Leiter.
export const LEVELS = [
  { xp: 0 },
  { xp: 5, maxHp: 2 },
  { xp: 12, maxHp: 2, atk: 1 },
  { xp: 22, maxHp: 2 },
  { xp: 35, maxHp: 2, atk: 1 },
  { xp: 50, maxHp: 2 },
  { xp: 70, maxHp: 2, atk: 1 },
  { xp: 95, maxHp: 2 },
  { xp: 125, maxHp: 2, atk: 1 },
  { xp: 160, maxHp: 2 },
];

// Meldung beim Aufstieg. {level} wird ersetzt.
export const LEVEL_UP_TEXT = 'You feel a little more finished. Level {level}.';
