// Zauber (seit Tag 7) aus dem krummen Turm. Man kann einen Zauber, solange man sein Buch dabeihat
// (Gegenstand mit spell: '<id>' in content/items.js). Jeder Zauber kostet cost Stück von SPELL_COST
// und eine Runde. Die Reihenfolge hier ist auch die der Tasten 1, 2, 3 und der Knöpfe unter der Karte.
//   ward: die nächsten charges Bisse prallen ab (player.ward zählt herunter).
//   hop:  ein Sprung über range Felder in die nächste Richtung, über Löcher, Wasser, Gruben oder eine Kreatur
//         (nicht über Wände, Bäume oder Dinge). Das Mittelfeld muss begehbar oder tief sein (Gelände mit low: true).
//   mend: heilt heal HP, nicht bei vollen HP.
export const SPELL_COST = 'ink';

export const SPELLS = [
  {
    id: 'ward',
    name: 'Ward',
    cost: 1,
    charges: 3,
    text: 'Draw a ring of ink round yourself. The next 3 bites glance off.',
    castText: 'You draw a ring of ink round your feet. It hums, and dares things to bite.',
  },
  {
    id: 'hop',
    name: 'Hop',
    cost: 1,
    range: 2,
    text: 'Jump two squares the way you choose: over a hole, a pit, water or a creature.',
    castText: 'You say the short word, and the floor lets go of you for a moment.',
    armText: 'HOP: which way? (Esc to keep your feet on the ground.)',
    failText: 'The spell looks where you want to land, and declines.',
  },
  {
    id: 'mend',
    name: 'Mend',
    cost: 1,
    heal: 6,
    text: 'Ink over your scrapes until they are drawn the way they were. +6 HP.',
    castText: 'You ink over your scrapes. They forget they were ever there.',
  },
];

export const SPELL_TEXT = {
  noInk: 'You need a drop of ink for that. The page stays blank.',
  full: 'You are already fully mended. The ink stays in the bottle.',
  wardHolds: 'The ink ring flares. The bite glances off.',
  wardGone: 'Your ink ring fades.',
};
