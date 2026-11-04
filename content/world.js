// Spielwelt: Karten als Textzeilen (Zeichen siehe tiles.js), dazu Objekte und Kreaturen.
export const PLAYER = { maxHp: 10, atk: 1 };

export const START = { map: 'meadow', x: 8, y: 5 };

export const MAPS = {
  meadow: {
    name: 'The Meadow',
    tiles: [
      '       TTTTTTTTTT        ',
      '     TT..........TT      ',
      '    T....,.......,.T     ',
      '   T...###.........,.T   ',
      '  T....#B#.........~~.T  ',
      '  T.,..#.#........~~~~T  ',
      '  T....#.#.........~~.T  ',
      '  T....#.#.....,......T  ',
      '   T....................  ',
      '   T..,..........,....T  ',
      '    TT...........,..TT   ',
      '      TTTTTTTTTTTTTT     ',
    ],
    entities: [
      {
        id: 'keeper', kind: 'npc', name: 'The Keeper', glyph: 'K', color: '#f2c56b', x: 12, y: 5,
        lines: [
          "Oh! You're awake. Good. That makes two of us, and a few rats.",
          "This place gets made one thing at a time, every night at midnight. I don't know who does it. I've stopped asking.",
          "Past those trees the world simply isn't finished. Walk into it, if you like. It's very polite about it.",
          "The well fixes most things. The rats are not one of the things it fixes.",
          "If you know what should exist tomorrow, write it down. Sometimes the night listens.",
        ],
      },
      {
        id: 'sign', kind: 'sign', name: 'Sign', glyph: '?', color: '#e6e3d3', x: 10, y: 8,
        text: 'OVERNIGHT. Population: you. Yesterday this sign did not exist.',
      },
      {
        id: 'well', kind: 'well', name: 'Well', glyph: 'O', color: '#6fb1e0', x: 14, y: 2,
        text: 'You drink from the well. The water tastes faintly of tomorrow. You feel better.',
      },
    ],
    spawns: [
      { type: 'rat', x: 18, y: 9 },
      { type: 'rat', x: 6, y: 9 },
      { type: 'rat', x: 16, y: 3 },
    ],
  },
};
