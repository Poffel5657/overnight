// Knacks (seit Tag 6): ein kleiner Fähigkeitenbaum. Jeder Aufstieg ab Stufe 2 gibt einen Punkt,
// den man im Fenster [ CHARA ] in einen Knack steckt. Bei Stufe 10 sind alle 9 Punkte verteilt.
// Pro Rang: maxHp, atk oder def kommt dazu. max = höchster Rang.
export const SKILLS = [
  { id: 'sturdy', name: 'Sturdy', max: 3, maxHp: 3, text: '+3 max HP per rank. You get harder to rub out.' },
  { id: 'sharp', name: 'Sharp', max: 3, atk: 1, text: '+1 attack per rank. Whatever you hold, you hold it better.' },
  { id: 'thick', name: 'Thick-skinned', max: 3, def: 1, text: '+1 defence per rank. Bites feel more like opinions.' },
];

export const SKILL_TEXT = 'You get the knack of it.';
