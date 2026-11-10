// Stimmzettel: Ideen aus alten Nächten, die eine zweite Chance bekommen. Spieler stimmen im Spiel ab,
// der Nachtlauf baut den Gewinner. Texte immer in eigenen Worten, nie Vorschlagstext.
// day: Tag, an dem dieser Zettel veröffentlicht wurde. Stimmen zählen nur, wenn sie diese Nummer tragen.
// since: Tag, an dem die Idee zum ersten Mal auf dem Zettel stand.
// lastResult: Ergebnis des vorigen Zettels, trägt der Nachtlauf beim Auszählen ein (oder null):
//   { ballot: 3, options: [{ text: 'A town of steam and gears…', votes: 4, won: true }, …] }
//   text wie auf dem alten Zettel, votes aus den gezählten Dateien, won genau einmal true.
export const BALLOT = {
  day: 8,
  options: [
    { id: 'hedge-maze', since: 6, text: 'A hedge maze grows off the meadow. Something with hooves guards the middle.' },
    { id: 'deeper-drains', since: 7, text: 'The drains go down another floor, and something worse than crumbs lives there.' },
    { id: 'standing-stones', since: 7, text: 'A ring of odd stones turns up in the Rough Draft. Nobody knows what it does.' },
    { id: 'hut-grows', since: 8, text: 'Your hut grows a roof, a proper door and an upstairs. The workbench moves in.' },
    { id: 'fourth-spell', since: 8, text: 'A fourth spellbook hides somewhere in the world. The Mage would love to read it.' },
  ],
  lastResult: {
    ballot: 7,
    options: [
      { text: 'The pond gets deeper. Someone finally invents swimming.', votes: 0, won: false },
      { text: 'A hedge maze grows off the meadow. Something with hooves guards the middle.', votes: 0, won: false },
      { text: 'The drains go down another floor, and something worse than crumbs lives there.', votes: 0, won: false },
      { text: 'Learn a trade: dig ore from the gear pits of Mainspring and work it at the bench.', votes: 0, won: true },
      { text: 'A ring of odd stones turns up in the Rough Draft. Nobody knows what it does.', votes: 0, won: false },
    ],
  },
};
