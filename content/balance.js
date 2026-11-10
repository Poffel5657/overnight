// Balance (seit dem großen Rebalance nach Tag 7). Der Probespieler in tests/balance/ kämpft gegen jede Kreatur
// mit der Ausrüstung, die man an ihrem Ort realistisch hat, und prüft, ob der Kampf zu ihrer Rolle passt.
//
// Jede Kreatur in content/creatures.js hat balance: { stage, role }.
//
// STAGES: so sieht ein Spieler aus, der an diesem Ort ankommt. Ehrlich schätzen, nicht hoffen.
//   level:   Stufe (die Erfahrung dafür bekommt er über gainXp, Knackpunkte verteilt er reihum)
//   skills:  Reihenfolge, in der er seine Knackpunkte verteilt (wiederholt sich, bis alle verteilt sind)
//   weapon:  Waffe in der Hand, armor: angelegte Rüstung
//   bag:     was er dabeihat (Getränke, Tinte, Bücher)
// Neue Orte bekommen hier eine neue Stufe. Neue Ausrüstung, die vor einem Ort leicht zu haben ist,
// gehört in die Stufe dieses Ortes, sonst rechnet der Probespieler mit einem zu schwachen Spieler.
export const STAGES = {
  meadow: { level: 1 },
  draft: { level: 3, weapon: 'stone-spear' },
  drains: { level: 4, weapon: 'stone-spear', armor: ['colander'] },
  sump: {
    level: 5, weapon: 'stone-spear', armor: ['colander', 'button-mail', 'rubber-boots'],
    bag: ['tonic', 'tonic'],
  },
  mainspring: {
    level: 6, weapon: 'drain-hook', armor: ['colander', 'button-mail', 'rubber-boots'],
    bag: ['tonic', 'tonic', 'strong-tea'],
  },
  tower: {
    level: 6, weapon: 'drain-hook', armor: ['colander', 'button-mail', 'rubber-boots'],
    bag: ['tonic', 'strong-tea'],
  },
  clocktower: {
    level: 7, weapon: 'drain-hook', armor: ['straw-hat', 'crow-coat', 'surveyor-boots'],
    bag: ['strong-tea', 'strong-tea', 'tonic', 'tome-ward', 'tome-mend', 'ink', 'ink', 'ink', 'ink'],
  },
};

export const SKILL_ORDER = ['sharp', 'sturdy', 'thick'];

// ROLES: was ein Kampf mit dieser Rolle sein soll. Der Probespieler spielt jede Taktik, die er kennt
// (stehen und hauen, zuschlagen und ausweichen, Takt abpassen), und nimmt die beste, so wie ein Spieler sie findet.
//   soloWin:  [min, max] Anteil gewonnener Kämpfe allein, mit der besten Taktik
//   hpLost:   [min, max] Anteil der max HP, den ein gewonnener Kampf im Schnitt kostet
//   group:    { size, minWin, hpLost }: so viele Spieler zusammen (gemeinsame Welt) gewinnen mindestens so oft
//             und verlieren dabei im Schnitt so viel ihrer HP (sonst ist es zu dritt geschenkt)
//   lazyWin:  höchstens so oft gewinnt, wer die Markierungen eines Flächenangriffs (aoe) nicht beachtet
//             (bei boss allein, bei group mit der Gruppe). Sonst ist der Flächenangriff nur Deko.
export const ROLES = {
  fodder: { text: 'harmlos: nebenbei wegzuhauen', soloWin: [0.97, 1], hpLost: [0, 0.4] },
  normal: { text: 'ein echter Gegner, kostet spürbar HP', soloWin: [0.85, 1], hpLost: [0.1, 0.7] },
  boss: { text: 'allein schaffbar, aber nur mit Einsatz', soloWin: [0.35, 0.9], hpLost: [0.4, 1], lazyWin: 0.4 },
  group: {
    text: 'allein kaum zu schaffen, zu dritt gut', soloWin: [0, 0.1], hpLost: [0, 1], lazyWin: 0.7,
    group: { size: 3, minWin: 0.75, hpLost: [0.1, 0.8] },
  },
};
