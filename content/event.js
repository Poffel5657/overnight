// Community-Event: eine gemeinsame Aufgabe für alle Spieler, höchstens eins gleichzeitig. null heißt: keins.
// Wann es eins gibt, entscheidet der Nachtlauf (siehe CLAUDE.md). Format:
// {
//   id: 'great-rat-count',            // Kleinbuchstaben, Ziffern, Bindestriche, höchstens 32 Zeichen
//   title: 'The Great Rat Count',     // kurz, Englisch
//   text: 'The Keeper wants the rats counted. Ideally by making fewer of them.',
//   task: 'Defeat 5 rats today.',     // was jeder Spieler pro Tag tut
//   reward: 'If enough of you help, the hut gets something nice.',
//   stat: 'kills', need: 5,           // Schlüssel in state.stats und wie viel er an einem Tag wachsen muss
//   goal: 20,                         // so viele Tagesbeiträge braucht es insgesamt
//   startDay: 4, endDay: 6,           // läuft vom Tag startDay bis einschließlich endDay
// }
export const EVENT = null;
