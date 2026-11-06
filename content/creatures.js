// Kreaturentypen. ai verweist auf einen Eintrag in AI_BEHAVIOURS aus src/game.js.
// xp = Erfahrung für den Sieg, biteVerb = was sie dem Spieler antun (Standard: bites),
// drop = { item, chance }: lässt beim Sieg manchmal etwas für den Beutel fallen.
export const CREATURES = {
  rat: {
    name: 'rat',
    glyph: 'r',
    color: '#c9a27a',
    hp: 2,
    atk: 1,
    hitChance: 0.6,
    ai: 'skulk',
    senseRange: 4,
    respawnTurns: 30,
    xp: 1,
  },
  // Tag 4: kamen aus der ausradierten Ecke im Rough Draft. Halb fertig, zäh, springen jede zweite Runde.
  frog: {
    name: 'smudged frog',
    glyph: 'f',
    color: '#8fae6a',
    hp: 5,
    atk: 2,
    hitChance: 0.5,
    ai: 'hop',
    senseRange: 5,
    respawnTurns: 50,
    xp: 2,
    biteVerb: 'headbutts',
    drop: { item: 'button', chance: 0.3 },
  },
};
