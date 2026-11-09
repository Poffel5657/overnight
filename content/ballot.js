// Stimmzettel: Ideen aus alten Nächten, die eine zweite Chance bekommen. Spieler stimmen im Spiel ab,
// der Nachtlauf baut den Gewinner. Texte immer in eigenen Worten, nie Vorschlagstext.
// day: Tag, an dem dieser Zettel veröffentlicht wurde. Stimmen zählen nur, wenn sie diese Nummer tragen.
// since: Tag, an dem die Idee zum ersten Mal auf dem Zettel stand.
// lastResult: Ergebnis des vorigen Zettels, trägt der Nachtlauf beim Auszählen ein (oder null):
//   { ballot: 3, options: [{ text: 'A town of steam and gears…', votes: 4, won: true }, …] }
//   text wie auf dem alten Zettel, votes aus den gezählten Dateien, won genau einmal true.
export const BALLOT = {
  day: 7,
  options: [
    { id: 'deep-pond', since: 5, text: 'The pond gets deeper. Someone finally invents swimming.' },
    { id: 'hedge-maze', since: 6, text: 'A hedge maze grows off the meadow. Something with hooves guards the middle.' },
    { id: 'deeper-drains', since: 7, text: 'The drains go down another floor, and something worse than crumbs lives there.' },
    { id: 'first-trade', since: 7, text: 'Learn a trade: dig ore from the gear pits of Mainspring and work it at the bench.' },
    { id: 'standing-stones', since: 7, text: 'A ring of odd stones turns up in the Rough Draft. Nobody knows what it does.' },
  ],
  lastResult: {
    ballot: 6,
    options: [
      { text: 'Your hut grows a roof and an upstairs overnight. The workbench moves in.', votes: 0, won: false },
      { text: 'A band of very small miners plays very loud music. Listening makes you brave.', votes: 0, won: false },
      { text: 'The pond gets deeper. Someone finally invents swimming.', votes: 0, won: false },
      { text: 'A crooked tower where a mage takes apprentices and teaches spells from dusty tomes.', votes: 3, won: true },
      { text: 'A hedge maze grows off the meadow. Something with hooves guards the middle.', votes: 1, won: false },
    ],
  },
};
