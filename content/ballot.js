// Stimmzettel: Ideen aus alten Nächten, die eine zweite Chance bekommen. Spieler stimmen im Spiel ab,
// der Nachtlauf baut den Gewinner. Texte immer in eigenen Worten, nie Vorschlagstext.
// day: Tag, an dem dieser Zettel veröffentlicht wurde. Stimmen zählen nur, wenn sie diese Nummer tragen.
// since: Tag, an dem die Idee zum ersten Mal auf dem Zettel stand.
// lastResult: Ergebnis des vorigen Zettels, trägt der Nachtlauf beim Auszählen ein (oder null):
//   { ballot: 3, options: [{ text: 'A town of steam and gears…', votes: 4, won: true }, …] }
//   text wie auf dem alten Zettel, votes aus den gezählten Dateien, won genau einmal true.
export const BALLOT = {
  day: 6,
  options: [
    { id: 'hut-grows', since: 4, text: 'Your hut grows a roof and an upstairs overnight. The workbench moves in.' },
    { id: 'dwarf-band', since: 4, text: 'A band of very small miners plays very loud music. Listening makes you brave.' },
    { id: 'deep-pond', since: 5, text: 'The pond gets deeper. Someone finally invents swimming.' },
    { id: 'wizard-tower', since: 6, text: 'A crooked tower where a mage takes apprentices and teaches spells from dusty tomes.' },
    { id: 'hedge-maze', since: 6, text: 'A hedge maze grows off the meadow. Something with hooves guards the middle.' },
  ],
  lastResult: {
    ballot: 5,
    options: [
      { text: 'A town of steam and gears, whose people have favours to ask.', votes: 4, won: true },
      { text: 'More weapons from the workbench: a knife, an axe, a sword.', votes: 0, won: false },
      { text: 'Your hut grows a roof and an upstairs overnight. The workbench moves in.', votes: 1, won: false },
      { text: 'A band of very small miners plays very loud music. Listening makes you brave.', votes: 0, won: false },
      { text: 'The pond gets deeper. Someone finally invents swimming.', votes: 0, won: false },
    ],
  },
};
