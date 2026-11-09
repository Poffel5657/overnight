// Geländetypen: Schlüssel ist das Zeichen in den Kartenzeilen aus world.js.
// bump = Meldung beim Dagegenlaufen, wenn das Feld nicht begehbar ist.
// low (seit Tag 7): tief genug, dass man mit dem Zauber HOP darüber springen kann.
export const TILES = {
  ' ': {
    name: 'nothing', glyph: ' ', fg: '#000000', bg: '#07070f', walkable: false,
    bump: "The world isn't finished here. Maybe tomorrow.",
  },
  '.': { name: 'grass', glyph: '.', fg: '#3f6b48', bg: '#14241b', walkable: true },
  ',': { name: 'flowers', glyph: '*', fg: '#d98fb5', bg: '#14241b', walkable: true },
  'T': {
    name: 'tree', glyph: '♣', fg: '#4f9a5d', bg: '#102018', walkable: false,
    bump: 'The trees here are mostly a suggestion, but a firm one.',
  },
  '#': {
    name: 'wall', glyph: '#', fg: '#a98a68', bg: '#2a2219', walkable: false,
    bump: 'Your hut. Sturdy, considering it is one day old.',
  },
  '~': {
    name: 'water', low: true, glyph: '~', fg: '#6fb1e0', bg: '#14304a', walkable: false,
    bump: 'The pond is cold, and nobody has invented swimming yet.',
  },
  // Seit Tag 3: flache Stelle am Teich, durch die man den spitzen Stein sieht.
  's': { name: 'shallows', glyph: '~', fg: '#9fd0ee', bg: '#1d4560', walkable: true },
  ':': {
    name: 'sketch', glyph: ':', fg: '#8a8fa8', bg: '#181a24', walkable: false,
    bump: "This part is only sketched in. It won't hold your weight yet.",
  },
  // Seit Tag 4: ausradierte Stellen im Rough Draft. Nicht vom Nightwright.
  'e': {
    name: 'rubbed out', glyph: '░', fg: '#4a4c5a', bg: '#0b0b12', walkable: false,
    bump: 'This bit has been rubbed out. There are crumbs. It feels colder than nothing.',
  },
  // Seit Tag 5: die Kanäle unter dem Brunnen.
  'W': {
    name: 'brick', glyph: '#', fg: '#5d6b66', bg: '#121a18', walkable: false,
    bump: 'Damp brick. Somebody laid it very quickly and very well.',
  },
  '_': { name: 'drain floor', glyph: '.', fg: '#47605a', bg: '#0e1514', walkable: true },
  'c': {
    name: 'channel', low: true, glyph: '≈', fg: '#5fa596', bg: '#0c2826', walkable: false,
    bump: 'The channel is going somewhere in a hurry. You are not invited.',
  },
  'p': { name: 'plank', glyph: '=', fg: '#a8703a', bg: '#0c2826', walkable: true },
  'B': { name: 'bed', glyph: '=', fg: '#e0705f', bg: '#2a2219', walkable: true },
  // Seit Tag 6: Tinte. Hält die ausradierte Ecke fest (Belohnung des Events "The Smudge Watch").
  'i': {
    name: 'ink line', glyph: '|', fg: '#7f9cf5', bg: '#10142a', walkable: false,
    bump: 'Fresh ink. It has dried hard. Nothing rubs through this.',
  },
  // Seit Tag 6: Mainspring, die Stadt aus Messing und Uhrwerk.
  'o': { name: 'cobbles', glyph: '·', fg: '#8a7550', bg: '#1d1710', walkable: true },
  'M': {
    name: 'brass', glyph: '#', fg: '#c9a04f', bg: '#2a1f0e', walkable: false,
    bump: 'Brass, warm to the touch. Somewhere inside, it ticks.',
  },
  'Q': {
    name: 'clock tower', glyph: 'Θ', fg: '#f2c56b', bg: '#2a1f0e', walkable: false,
    bump: 'The clock tower. It is either very early or very late. It refuses to say which.',
  },
  '%': {
    name: 'gear pit', low: true, glyph: '%', fg: '#b58b45', bg: '#120d07', walkable: false,
    bump: 'Gears the size of wagon wheels turn down there. Best keep your fingers.',
  },
  // Seit Tag 7: der krumme Turm der Magierin.
  'k': {
    name: 'tower wall', glyph: '#', fg: '#8f86a8', bg: '#16131f', walkable: false,
    bump: 'The tower wall leans. It has been leaning for years, apparently, since last night.',
  },
  'l': { name: 'floorboards', glyph: '.', fg: '#6d5a7a', bg: '#130f1a', walkable: true },
  'b': {
    name: 'bookshelf', glyph: '≡', fg: '#b08a5a', bg: '#1c1420', walkable: false,
    bump: 'Books, floor to ceiling. Several of them are muttering.',
  },
  'h': {
    name: 'hole in the floor', glyph: ' ', fg: '#000000', bg: '#050308', walkable: false, low: true,
    bump: 'A hole in the floorboards. Below: more tower, somehow. You could hop it, with the right word.',
  },
  // Seit Tag 7: im Uhrturm von Mainspring.
  'g': {
    name: 'turning gears', glyph: '*', fg: '#b58b45', bg: '#120d07', walkable: false, low: true,
    bump: 'Gears, turning just below the floor. Too wide to step over. A hop, maybe.',
  },
};
