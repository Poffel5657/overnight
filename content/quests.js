// Quests (seit Tag 5). Eine Quest beginnt immer bei einer Figur (giver = id eines npc).
// Sie wird angeboten, sobald der Spieler startItem trägt (ohne startItem: beim nächsten Gespräch).
// Aufgabe: count Stück von item bringen. Die Figur nimmt sie, gibt reward (item und/oder xp) und sagt doneText.
// Zustand im Spielstand: flags.quests[id] = 'active' oder 'done'.
// Im Quest-Log stehen title, task und der Fortschritt (progressLabel n/count, danach returnText).
export const QUESTS = [
  {
    id: 'grey-crumbs',
    giver: 'keeper',
    title: 'Grey Crumbs',
    startItem: 'crumb',
    item: 'crumb',
    count: 3,
    progressLabel: 'crumbs',
    returnText: 'bring them to the Keeper',
    task: 'Bring the Keeper 3 grey crumbs. Frogs carry them. Some lie near rubbed-out places.',
    offerText: "Is that one of those grey crumbs? Let me see. Hm. Bring me three, so I can be sure of what I think I'm sure of.",
    remindText: 'Three crumbs, when you have them. No hurry. Well. Some hurry.',
    doneText: "Rubber. Eraser rubber. Somebody is tidying us up, a corner at a time. Take this key. It fits a gate in the drains, under the well. Whatever washes down there, I'd like it gone.",
    reward: { item: 'keeper-key', xp: 5 },
  },
];
