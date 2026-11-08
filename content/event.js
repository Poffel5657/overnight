// Community-Event: eine gemeinsame Aufgabe für alle Spieler, höchstens eins gleichzeitig. null heißt: keins.
// Wann es eins gibt, entscheidet der Nachtlauf (siehe CLAUDE.md). Format:
// {
//   id: 'great-rat-count',            // Kleinbuchstaben, Ziffern, Bindestriche, höchstens 32 Zeichen
//   title: 'The Great Rat Count',     // kurz, Englisch
//   text: 'The Keeper wants the rats counted. Ideally by making fewer of them.',
//   giver: 'keeper',                  // id der Figur (npc), die das Event leitet. Erst nach dem Gespräch mit ihr
//                                     // sieht man die Aufgabe; vorher zeigt die Anzeige nur, zu wem man gehen soll.
//   intro: 'Count the rats for me? …',// was die Figur beim ersten Gespräch sagt (höchstens 200 Zeichen)
//   task: 'Defeat 5 rats.',           // was jeder Spieler pro Tag tut, ohne "today"
//   reward: 'If enough of you help, the hut gets something nice.',
//   stat: 'kills', need: 5,           // Schlüssel in state.stats und wie viel er an einem Tag wachsen muss
//   goal: 20,                         // so viele Tagesbeiträge braucht es insgesamt
//   startDay: 4, endDay: 6,           // läuft vom Tag startDay bis einschließlich endDay
// }
// Tag 6: "The Smudge Watch" (Tag 4 bis 5) ist ausgewertet: 13 Beiträge bei Ziel 6, erreicht. Frühestens Tag 7 ein neues.
export const EVENT = null;
