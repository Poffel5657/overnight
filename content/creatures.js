// Kreaturentypen. ai verweist auf einen Eintrag in AI_BEHAVIOURS aus src/game.js.
// xp = Erfahrung für den Sieg, biteVerb = was sie dem Spieler antun (Standard: bites),
// drops = [{ item, chance }]: lässt beim Sieg manchmal etwas fallen (jeder Eintrag wird einzeln gewürfelt).
// boss: true = einmalig. Nach dem Sieg merkt sich der Spielstand das (flags.slain), der Spawn entfällt dann.
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
    drops: [{ item: 'button', chance: 0.3 }, { item: 'crumb', chance: 0.25 }],
  },
  // Tag 5: in den Kanälen. Liegen am Wasser und rühren sich nicht, beißen aber, wer zu nahe kommt.
  eel: {
    name: 'gutter eel',
    glyph: 'e',
    color: '#7fc0a8',
    hp: 4,
    atk: 2,
    hitChance: 0.5,
    ai: 'lurk',
    senseRange: 1,
    respawnTurns: 60,
    xp: 3,
    biteVerb: 'nips',
    drops: [{ item: 'button', chance: 0.2 }],
  },
  // Tag 5: der erste Boss. Ein Haufen Radierkrümel, der beschlossen hat, jemand zu sein. Wohnt im Sumpf.
  'crumb-heap': {
    name: 'Crumb Heap',
    glyph: '&',
    color: '#d6c3cf',
    hp: 30,
    atk: 5,
    hitChance: 0.6,
    ai: 'trudge',
    senseRange: 5,
    respawnTurns: 100000,
    xp: 20,
    biteVerb: 'smothers',
    boss: true,
    drops: [{ item: 'drain-hook', chance: 1 }],
  },
};
