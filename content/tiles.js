// Geländetypen: Schlüssel ist das Zeichen in den Kartenzeilen aus world.js.
// bump = Meldung beim Dagegenlaufen, wenn das Feld nicht begehbar ist.
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
    name: 'water', glyph: '~', fg: '#6fb1e0', bg: '#14304a', walkable: false,
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
    name: 'channel', glyph: '≈', fg: '#5fa596', bg: '#0c2826', walkable: false,
    bump: 'The channel is going somewhere in a hurry. You are not invited.',
  },
  'p': { name: 'plank', glyph: '=', fg: '#a8703a', bg: '#0c2826', walkable: true },
  'B': { name: 'bed', glyph: '=', fg: '#e0705f', bg: '#2a2219', walkable: true },
};
