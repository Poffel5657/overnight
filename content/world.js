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
          "This place gets made one thing at a time, every night at midnight. Folks say it's the Nightwright. I've never met them. I've stopped asking.",
          "Past those trees the world simply isn't finished. Walk into it, if you like. It's very polite about it.",
          "The well fixes most things. The rats are not one of the things it fixes.",
          "If you know what should exist tomorrow, write it down. Sometimes the Nightwright listens.",
          "There's a door in the eastern trees now. Brown. I didn't order a door. Nobody orders doors.",
        ],
        // Einmalige Bemerkung, sobald der Spieler den Gegenstand trägt.
        itemLines: {
          stick: "Is that a stick? It wasn't there yesterday. Rats respect a good stick. Mostly.",
        },
      },
      {
        id: 'east-door', kind: 'door', name: 'Brown door', glyph: '+', color: '#a8703a', x: 23, y: 8,
        to: { map: 'draft', x: 2, y: 6 },
        text: 'You open a brown door that stands in the gap all by itself. The other side smells of pencil.',
      },
      {
        id: 'sign', kind: 'sign', name: 'Sign', glyph: '?', color: '#e6e3d3', x: 10, y: 8,
        text: 'OVERNIGHT. Population: you. Yesterday this sign did not exist.',
      },
      {
        id: 'stick', kind: 'pickup', item: 'stick', name: 'Stick', glyph: '/', color: '#b98a52', x: 20, y: 8,
        text: 'You pick up a stick. It is very straight, as if someone made it on purpose last night.',
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
  // Tag 2: Der erste Ort hinter der Wiese, erreichbar durch die Tür in der Lücke im Osten.
  draft: {
    name: 'The Rough Draft',
    tiles: [
      ' TTTTTTTTTTTTT:::::   ',
      'T.............:.:..:  ',
      'T...,....TT.....:..:  ',
      'T........TT..,....:.: ',
      'T..,...........:.....:',
      'T.........,.....:...: ',
      'T.................:..:',
      'T....,.............:  ',
      'T.......,.........:.: ',
      'T..........:.:..::.:  ',
      ' TTTTTTTTTT:::::::::  ',
    ],
    entities: [
      {
        id: 'west-door', kind: 'door', name: 'Brown door', glyph: '+', color: '#a8703a', x: 1, y: 6,
        to: { map: 'meadow', x: 22, y: 8 },
        text: 'You step back through the brown door. The meadow looks very finished by comparison.',
      },
      {
        id: 'draft-sign', kind: 'sign', name: 'Sign', glyph: '?', color: '#e6e3d3', x: 5, y: 3,
        text: 'THE ROUGH DRAFT. Please mind the lines. They are still drying.',
      },
      {
        id: 'scarecrow', kind: 'npc', name: 'The Scarecrow', glyph: 'S', color: '#d8b45a', x: 12, y: 5,
        lines: [
          'Hello. I was put up last night. They made my hat first. Priorities, I suppose.',
          "The grey lines over there are only pencil. Don't lean on them.",
          "I'm meant to scare crows. Nobody has made any crows yet, so I practise on the rats.",
          'If you meet the Nightwright, tell them the door sticks a little.',
        ],
        itemLines: {
          stick: "A stick! I'm mostly sticks myself. Be gentle with it.",
        },
      },
    ],
    spawns: [
      { type: 'rat', x: 8, y: 8 },
      { type: 'rat', x: 15, y: 2 },
    ],
  },
};
