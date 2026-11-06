// Stimmzettel: Ideen aus alten Nächten, die eine zweite Chance bekommen. Spieler stimmen im Spiel ab,
// der Nachtlauf baut den Gewinner. Texte immer in eigenen Worten, nie Vorschlagstext.
// day: Tag, an dem dieser Zettel veröffentlicht wurde. Stimmen zählen nur, wenn sie diese Nummer tragen.
// since: Tag, an dem die Idee zum ersten Mal auf dem Zettel stand.
// lastResult: Ergebnis des vorigen Zettels, trägt der Nachtlauf beim Auszählen ein (oder null):
//   { ballot: 3, options: [{ text: 'A town of steam and gears…', votes: 4, won: true }, …] }
//   text wie auf dem alten Zettel, votes aus den gezählten Dateien, won genau einmal true.
export const BALLOT = {
  day: 3,
  options: [
    { id: 'well-drains', since: 3, text: 'Slip into the well and find your way out through the drains below.' },
    { id: 'clockwork-town', since: 3, text: 'A town of steam and gears, whose people have favours to ask.' },
    { id: 'wheel-of-chance', since: 3, text: 'A wheel of chance that hands out odd things, or odd visitors.' },
    { id: 'more-weapons', since: 3, text: 'More weapons from the workbench: a knife, an axe, a sword.' },
  ],
  lastResult: null,
};
