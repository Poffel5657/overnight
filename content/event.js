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
export const EVENT = {
  id: 'smudge-watch',
  title: 'The Smudge Watch',
  text: 'The Scarecrow wants someone to keep watch on the rubbed-out corner. It cannot leave its pole.',
  task: 'Earn 6 XP today.',
  reward: 'Hold the line, and the corner gets something to hold it in place.',
  stat: 'xp',
  need: 6,
  goal: 6,
  startDay: 4,
  endDay: 5,
};
