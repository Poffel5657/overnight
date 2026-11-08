// Quests (seit Tag 5). Eine Quest beginnt immer bei einer Figur (giver = id eines npc).
// Sie wird angeboten, sobald der Spieler startItem trägt (ohne startItem: beim nächsten Gespräch).
// Hat eine Figur mehrere Quests, gilt die erste, die noch nicht erledigt ist.
// Zwei Arten von Aufgaben:
//   item/count: count Stück von item bringen. Die Figur nimmt sie beim Abschluss.
//   stat/count (seit Tag 6): state.stats[stat] muss seit dem Annehmen um count wachsen
//     (Startwert in flags.questBase[id]). Bisher: 'together' = Siege zusammen mit einem Echo.
// reward: { item, count (Standard 1), xp }. doneText sagt die Figur beim Abschluss.
// after (seit Tag 6): erst anbieten, wenn diese andere Quest erledigt ist.
// repeat: 'daily' (seit Tag 6): nach dem Abschluss in der nächsten Nacht wieder zu haben (flags.questDay[id]).
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
  // Tag 6: Die Echos sind da. Der Keeper will sehen, dass man zusammen mehr schafft.
  {
    id: 'many-hands',
    giver: 'keeper',
    title: 'Many Hands',
    stat: 'together',
    count: 3,
    progressLabel: 'shared victories',
    returnText: 'tell the Keeper',
    task: 'Defeat 3 creatures together with an Echo. Both of you must land a blow.',
    offerText: "Those footprints in the drains weren't ghosts. They're Echoes: other folk, drawn into the same world. Go and fight beside one. Three times. Then tell me what it was like.",
    remindText: 'Find an Echo, stand next to them, and hit the same thing. It is friendlier than it sounds.',
    doneText: 'So it is true. We are not a village of one any more. Here, two flasks of my strong tea. One for you, and one for whoever turns up.',
    reward: { item: 'strong-tea', count: 2, xp: 8 },
  },
  // Tag 6: Mainspring. Der Tinker repariert die Stadt, aber ihm gehen die Federn aus.
  {
    id: 'loose-springs',
    giver: 'tinker',
    title: 'Loose Springs',
    item: 'spring',
    count: 3,
    progressLabel: 'springs',
    returnText: 'bring them to the Tinker',
    task: 'Bring the Tinker 3 springs. The clockwork mice in the Winding Yard drop them.',
    offerText: 'Springs! Everything here runs on springs, and the mice keep running off with them. Bring me three and I will make you something with a proper handle.',
    remindText: 'Three springs. The mice in the yard to the east. They bite, but only in a ticklish way.',
    doneText: 'Lovely. Coiled just right. Here, this wrench has been waiting for someone who hits things.',
    reward: { item: 'wrench', xp: 6 },
  },
  // Tag 6: Täglicher Gefallen beim Mayor (Wunsch nach täglichen Aufgaben).
  {
    id: 'winding-duty',
    giver: 'mayor',
    title: 'Winding Duty',
    repeat: 'daily',
    item: 'spring',
    count: 2,
    progressLabel: 'springs',
    returnText: 'bring them to the Mayor',
    task: 'Bring the Mayor 2 springs so the town keeps ticking. A new favour every night.',
    offerText: 'Ahem. As Mayor I must ask a favour. Two springs, for the town clock. Every night. It is a very small town, but it is a very large clock.',
    remindText: 'Two springs, citizen. The clock is counting on you. Literally.',
    doneText: 'Splendid. The town will tick for another day. Take these buttons, from the civic purse.',
    reward: { item: 'button', count: 2, xp: 4 },
  },
  // Tag 6: Täglicher Gefallen beim Dealer, der Dinge sammelt, bevor sie verschwinden.
  {
    id: 'odd-jobs',
    giver: 'dealer',
    title: 'Odd Jobs',
    repeat: 'daily',
    after: 'grey-crumbs',
    item: 'crumb',
    count: 2,
    progressLabel: 'crumbs',
    returnText: 'bring them to the Dealer',
    task: 'Bring the Dealer 2 grey crumbs. A new job every night, no questions asked.',
    offerText: 'Got a little job, if you want it. Two grey crumbs. Every night. Why? I collect things before they go missing. Including the missing.',
    remindText: 'Two crumbs. Frogs, corners, the drains. You know where.',
    doneText: 'Pleasure doing business. Three buttons. Spend them at the stall, it is painted now.',
    reward: { item: 'button', count: 3, xp: 3 },
  },
];
