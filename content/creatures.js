// Kreaturentypen. ai verweist auf einen Eintrag in AI_BEHAVIOURS aus src/game.js.
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
  },
};
