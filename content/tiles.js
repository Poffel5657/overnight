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
  ':': {
    name: 'sketch', glyph: ':', fg: '#8a8fa8', bg: '#181a24', walkable: false,
    bump: "This part is only sketched in. It won't hold your weight yet.",
  },
  'B': { name: 'bed', glyph: '=', fg: '#e0705f', bg: '#2a2219', walkable: true },
};
