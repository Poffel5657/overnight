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
      '  T.,..#.#........s~~~T  ',
      '  T....#.#.........~~.T  ',
      '  .....#.#.....,......T  ',
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
          "Someone put a workbench by your hut. It hums when you bring it two things that belong together.",
      "There's a dealer past the brown door now, with a wheel. I asked what they sell. They said: yes.",
      "You look sturdier than you did. Fighting rats is good for you, apparently. Nobody tell the rats.",
          "Frogs keep tracking grey crumbs onto my meadow. If you find one, show me. I have a feeling about them.",
          "If you drink from the well when you're already fine, mind the edge. It's deeper than it was.",
          "Have you seen them? Pale shapes, walking about like you. Echoes, I call them. The Nightwright drew more than one of you.",
          'There is a gate in the western trees now. It ticks. I went through. There is a whole town in there, and a Mayor, who wound me up.',
        ],
        // Einmalige Bemerkung, sobald der Spieler den Gegenstand trägt.
        itemLines: {
          stick: "Is that a stick? It wasn't there yesterday. Rats respect a good stick. Mostly.",
          'stone-spear': "A spear! Now we're a settlement with a weapons industry. Don't tell the rats.",
          'drain-hook': "That came out of the sump? Then the sump is a little emptier. Good. I never liked the sump.",
          wrench: 'A wrench from Mainspring. They make tools over there that actually fit your hand. Show-offs.',
        },
      },
      {
        id: 'bench', kind: 'bench', name: 'Workbench', glyph: 'π', color: '#c49a6c', x: 10, y: 6,
        text: 'A workbench, still smelling of sawdust. It has nothing to work on.',
      },
      {
        id: 'pointy-rock', kind: 'pickup', item: 'pointy-rock', name: 'Pointed rock', glyph: '^', color: '#c8ccd4', x: 18, y: 5,
        text: 'You fish a pointed rock out of the shallows. It was always there, apparently. You just never looked.',
      },
      {
        id: 'east-door', kind: 'door', name: 'Brown door', glyph: '+', color: '#a8703a', x: 23, y: 8,
        to: { map: 'draft', x: 2, y: 6 },
        text: 'You open a brown door that stands in the gap all by itself. The other side smells of pencil.',
      },
      {
        id: 'sign', kind: 'sign', name: 'Sign', glyph: '?', color: '#e6e3d3', x: 10, y: 8,
        text: 'OVERNIGHT. Population: you, and the Echoes. Someone has corrected this sign in pencil.',
      },
      {
        id: 'stick', kind: 'pickup', item: 'stick', name: 'Stick', glyph: '/', color: '#b98a52', x: 20, y: 8,
        text: 'You pick up a stick. It is very straight, as if someone made it on purpose last night.',
      },
      // Tag 6: Ein tickendes Messingtor in den westlichen Bäumen führt nach Mainspring (Gewinner von Zettel 5).
      {
        id: 'west-gate', kind: 'door', name: 'Brass gate', glyph: '+', color: '#c9a04f', x: 2, y: 7,
        to: { map: 'town', x: 2, y: 6 },
        text: 'The brass gate ticks twice and lets you through. On the other side, everything is winding.',
      },
      // Tag 5: Wer gesund ist und trotzdem trinkt, rutscht hinein (down) und landet in den Kanälen.
      {
        id: 'well', kind: 'well', name: 'Well', glyph: 'O', color: '#6fb1e0', x: 14, y: 2,
        text: 'You drink from the well. The water tastes faintly of tomorrow. You feel better.',
        down: { map: 'drains', x: 2, y: 2 },
        downText: 'You lean in for a drink you do not need, and keep leaning. Splash. You are in the drains.',
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
      'T....,.....i.......:  ',
      'T.......,..ei.....:.: ',
      'T........ieeeei.::.:  ',
      ' TTTTTTTTTeeeeee::::  ',
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
          'Something rubbed out the bottom corner last night. The Nightwright only ever adds. I checked.',
          "Frogs crawled out of the rubbed bit. They look half finished. I don't think they're meant to scare.",
          'If the rubbing-out spreads, someone ought to keep watch. I would, but I am attached to this pole.',
          'There is a grate in the grass now. Things gurgle under it. I preferred not knowing that.',
          'You kept watch, all of you. Somebody inked a line round the rubbed bit overnight. It has not crept an inch since.',
          'Those pale walkers are Echoes. More of you! I tried to scare one. It waved. I did not know what to do with my arms.',
        ],
        // Tag 6: Dank für die Wache (Event "The Smudge Watch" erreicht). Einmal pro Spieler.
        gift: {
          item: 'straw-hat',
          xp: 5,
          text: 'You held the watch, you and the others. The corner has stopped spreading. Take my spare hat. They made it first, after all.',
        },
        itemLines: {
          stick: "A stick! I'm mostly sticks myself. Be gentle with it.",
          'stone-spear': "Is that a stick with a rock on it? Please don't introduce me to the workbench.",
        },
      },
      // Tag 4: Der Dealer und sein Glücksrad (Daten in content/wheel.js).
      {
        id: 'dealer', kind: 'npc', name: 'The Dealer', glyph: '$', color: '#b6d96a', x: 16, y: 7,
        lines: [
          'Psst. Surprises. Fresh tonight. I know exactly what I sell, it just has not been painted in yet.',
          'The wheel is free once a night. After that it takes buttons. Frogs have buttons. Do not ask me why.',
          "Where did I come from? Same as you. One night I wasn't, and then I was, holding a wheel.",
          'Business has been good since the corner got rubbed out. People want surprises when things go missing.',
          'The stall is painted in at last. Tonics, tea, a rock. Buttons only. I do not take echoes.',
          'Lots of new faces about. Pale ones. Good. More customers, more surprises.',
        ],
        itemLines: {
          'stone-spear': 'Nice spear. Not for sale? Pity. Everything is for sale, eventually.',
        },
      },
      // Tag 6: Der Stand des Dealers (Ware in content/shops.js).
      {
        id: 'dealer-stall', kind: 'shop', shop: 'dealer', name: "Dealer's stall", glyph: '=', color: '#b6d96a', x: 15, y: 7,
      },
      {
        id: 'wheel', kind: 'wheel', name: 'Wheel of Chance', glyph: '¤', color: '#f2c56b', x: 17, y: 6,
      },
      // Tag 5: ein Gitter im Gras führt hinunter in die Kanäle.
      {
        id: 'draft-grate', kind: 'door', name: 'Drain grate', glyph: '▤', color: '#8a9a96', x: 3, y: 8,
        to: { map: 'drains', x: 27, y: 2 },
        text: 'You lift the grate and climb down. It is damp, and it smells of tomorrow, only older.',
      },
      {
        id: 'draft-crumb', kind: 'pickup', item: 'crumb', name: 'Grey crumb', glyph: '·', color: '#d6c3cf', x: 10, y: 8,
        text: 'At the edge of the rubbed-out bit lies a grey crumb. You pocket it. It is faintly warm.',
      },
    ],
    spawns: [
      { type: 'rat', x: 8, y: 8 },
      { type: 'rat', x: 15, y: 2 },
      { type: 'frog', x: 13, y: 8 },
      { type: 'frog', x: 15, y: 9 },
    ],
  },
  // Tag 5 (Gewinner von Zettel 4): die Kanäle unter dem Brunnen. Leiter zurück zum Brunnen,
  // Gitter hinauf in den Rough Draft, und hinter einem verschlossenen Gitter der Sumpf mit dem Krümelhaufen.
  drains: {
    name: 'The Drains',
    tiles: [
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
      'W____W_______________W______WWWW',
      'W____W_______________W_______WWW',
      'W____________________________WWW',
      'W____W_______________W_______WWW',
      'W____W_______________W_______WWW',
      'WWccccccpcccccccccccccccpcccccWW',
      'W______W_______________W_WWWWWWW',
      'W______W_______________W_____WWW',
      'W______________________W_____WWW',
      'W______W_______________W_____WWW',
      'W______W_______________W_____WWW',
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
    ],
    entities: [
      {
        id: 'drain-ladder', kind: 'door', name: 'Ladder', glyph: 'H', color: '#c49a6c', x: 2, y: 1,
        to: { map: 'meadow', x: 14, y: 3 },
        text: 'You climb the ladder and out over the rim of the well. Nobody saw. Probably.',
      },
      {
        id: 'drains-sign', kind: 'sign', name: 'Sign', glyph: '?', color: '#e6e3d3', x: 3, y: 4,
        text: 'THE DRAINS. Everything ends up here eventually. Please keep left of the water.',
      },
      {
        id: 'drain-chest', kind: 'chest', item: 'colander', name: 'Chest', glyph: '■', openGlyph: '□', color: '#c49a6c', x: 2, y: 10,
        text: 'You open the chest. Inside: a colander. It fits your head as if it were measured for it.',
        emptyText: 'The chest is empty. It looks pleased to have been useful.',
      },
      // Leise Vorbereitung auf etwas, das noch geheim ist.
      {
        id: 'footprints', kind: 'sign', name: 'Footprints', glyph: '"', color: '#8fb8c8', x: 13, y: 9,
        text: 'Wet footprints of every size now, crossing and recrossing yours. The Echoes have been down here too.',
      },
      {
        id: 'drains-crumb', kind: 'pickup', item: 'crumb', name: 'Grey crumb', glyph: '·', color: '#d6c3cf', x: 18, y: 11,
        text: 'A grey crumb has washed up against the brick. You pocket it. The water carried it from somewhere.',
      },
      {
        id: 'drain-grate', kind: 'door', name: 'Drain grate', glyph: '▤', color: '#8a9a96', x: 27, y: 1,
        to: { map: 'draft', x: 4, y: 8 },
        text: 'You push up a grate and climb out into grass that smells of pencil. The Rough Draft.',
      },
      {
        id: 'sump-gate', kind: 'gate', key: 'keeper-key', name: 'Iron gate', glyph: '|', color: '#c8ccd4', x: 24, y: 7,
        text: 'An iron gate with a big keyhole. Something on the other side breathes, slowly, like a pile of sand would.',
        openText: "The Keeper's key turns with a groan, and stays in the lock. The gate swings open. Something stirs in the sump.",
      },
      {
        id: 'sump-chest', kind: 'chest', item: 'rubber-boots', name: 'Chest', glyph: '■', openGlyph: '□', color: '#c49a6c', x: 28, y: 11,
        text: 'You open the chest. Rubber boots, your size, with a note in pencil: "for the wet bits".',
        emptyText: 'The chest is empty. The note is gone too.',
      },
    ],
    spawns: [
      { type: 'rat', x: 10, y: 2 },
      { type: 'rat', x: 16, y: 9 },
      { type: 'eel', x: 12, y: 5 },
      { type: 'eel', x: 19, y: 7 },
      { type: 'crumb-heap', x: 26, y: 9 },
    ],
  },
  // Tag 6 (Gewinner von Zettel 5): Mainspring, eine Stadt aus Messing und Uhrwerk hinter dem Messingtor im Westen der Wiese.
  // Im Osten der Winding Yard mit Uhrwerkmäusen und der Overwound Clock, die man besser zu mehreren angeht.
  town: {
    name: 'Mainspring',
    tiles: [
      'MMMMMMMMMMMMMMMMMMMMMMMMMMMMMM',
      'MooooooMMMMMQQQQQMMMMooooooooM',
      'MoooooooooooQQQQQoooMooooooooM',
      'Mooo%%ooooooooooooooMooooooooM',
      'MooooooMooooooooooooMooo%%oooM',
      'MooooooMooooooooooooMooooooooM',
      'MooooooooooooooooooooooooooooM',
      'MooooooooooooooooooooooooooooM',
      'MoooooooooooooooooooMooooooooM',
      'Mooo%ooooooooooo%%ooMooooooooM',
      'MoooooooooooooooooooMooooooooM',
      'MoooooooooooooooooooMooooooooM',
      'MMMMMMMMMMMMMMMMMMMMMMMMMMMMMM',
    ],
    entities: [
      {
        id: 'town-gate', kind: 'door', name: 'Brass gate', glyph: '+', color: '#c9a04f', x: 1, y: 6,
        to: { map: 'meadow', x: 3, y: 7 },
        text: 'The gate ticks you back out onto the meadow. It is very quiet without all the clocks.',
      },
      {
        id: 'town-sign', kind: 'sign', name: 'Sign', glyph: '?', color: '#e6e3d3', x: 3, y: 5,
        text: 'MAINSPRING. Population: wound daily. Please keep your fingers out of the gears.',
      },
      {
        id: 'tinker', kind: 'npc', name: 'The Tinker', glyph: 'T', color: '#e0a35f', x: 3, y: 2,
        lines: [
          'Mind the gears. I fix things. Mostly the town. The town mostly needs fixing.',
          'We were drawn in all at once, the whole town, already ticking. Nobody remembers being wound. Somebody must have.',
          'The mice in the Winding Yard were meant to carry springs to me. Now they just carry them.',
          'There is something big in the yard. Wound far too tight. I would not go alone. Go with an Echo or two.',
        ],
        itemLines: {
          wrench: 'Treat that wrench well. It has opinions about bolts.',
          'stone-spear': 'A spear made of a rock and a stick? Charming. Primitive, but charming.',
        },
      },
      {
        id: 'mayor', kind: 'npc', name: 'The Mayor', glyph: 'M', color: '#f2c56b', x: 14, y: 4,
        lines: [
          'Welcome to Mainspring, citizen! Population: everyone who has been wound today.',
          'The clock tower keeps the town going. If the clock stops, we all stop. No pressure.',
          'I have a key in my back. Please do not mention it. Everyone has one. It is rude to point.',
          'The meadow folk seem nice. Your Keeper did not have a key at all. I wound him anyway, out of politeness.',
        ],
      },
      {
        id: 'yard-sign', kind: 'sign', name: 'Sign', glyph: '?', color: '#e6e3d3', x: 22, y: 6,
        text: 'THE WINDING YARD. Loose mice. One loose clock. Visit in company.',
      },
    ],
    spawns: [
      { type: 'mouse', x: 9, y: 9 },
      { type: 'mouse', x: 24, y: 2 },
      { type: 'mouse', x: 27, y: 6 },
      { type: 'mouse', x: 23, y: 10 },
      { type: 'overwound-clock', x: 27, y: 10 },
    ],
  },
};

