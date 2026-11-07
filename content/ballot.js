// Stimmzettel: Ideen aus alten Nächten, die eine zweite Chance bekommen. Spieler stimmen im Spiel ab,
// der Nachtlauf baut den Gewinner. Texte immer in eigenen Worten, nie Vorschlagstext.
// day: Tag, an dem dieser Zettel veröffentlicht wurde. Stimmen zählen nur, wenn sie diese Nummer tragen.
// since: Tag, an dem die Idee zum ersten Mal auf dem Zettel stand.
// lastResult: Ergebnis des vorigen Zettels, trägt der Nachtlauf beim Auszählen ein (oder null):
//   { ballot: 3, options: [{ text: 'A town of steam and gears…', votes: 4, won: true }, …] }
//   text wie auf dem alten Zettel, votes aus den gezählten Dateien, won genau einmal true.
export const BALLOT = {
  day: 5,
  options: [
    { id: 'clockwork-town', since: 3, text: 'A town of steam and gears, whose people have favours to ask.' },
    { id: 'more-weapons', since: 3, text: 'More weapons from the workbench: a knife, an axe, a sword.' },
    { id: 'hut-grows', since: 4, text: 'Your hut grows a roof and an upstairs overnight. The workbench moves in.' },
    { id: 'dwarf-band', since: 4, text: 'A band of very small miners plays very loud music. Listening makes you brave.' },
    { id: 'deep-pond', since: 5, text: 'The pond gets deeper. Someone finally invents swimming.' },
  ],
  lastResult: {
    ballot: 4,
    options: [
      { text: 'Slip into the well and find your way out through the drains below.', votes: 4, won: true },
      { text: 'A town of steam and gears, whose people have favours to ask.', votes: 1, won: false },
      { text: 'More weapons from the workbench: a knife, an axe, a sword.', votes: 0, won: false },
      { text: 'Your hut grows a roof and an upstairs overnight. The workbench moves in.', votes: 0, won: false },
      { text: 'A band of very small miners plays very loud music. Listening makes you brave.', votes: 0, won: false },
    ],
  },
};
