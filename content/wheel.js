// Das Glücksrad des Dealers im Rough Draft (seit Tag 4, Gewinner von Zettel 3).
// Einmal pro Nacht dreht es umsonst, danach kostet jede Drehung einen Knopf (cost).
// Ein Feld (wedge) hat weight (Häufigkeit), effect und text. Effekte stehen in WHEEL_EFFECTS in src/game.js:
//   xp (amount), heal, item (item, unique = höchstens eins), visitor (creature), nothing, maxHp (amount).
export const WHEEL = {
  cost: 'button',
  freeText: 'The Dealer gives the wheel a shove. "First one tonight is on the house."',
  paidText: 'You drop a button in the slot. The Dealer gives the wheel a shove.',
  emptyText: 'The wheel has had its free spin tonight. The slot says: ONE BUTTON.',
  wedges: [
    { weight: 3, effect: 'xp', amount: 3, text: 'It stops on a little star. You feel slightly more experienced.' },
    { weight: 3, effect: 'heal', text: 'It stops on a cup of tea. You feel completely mended.' },
    { weight: 2, effect: 'item', item: 'button', text: 'A button rolls out of the wheel. The Dealer pretends not to see.' },
    {
      weight: 2, effect: 'item', item: 'pencil-stub', unique: true,
      text: 'A pencil stub drops out. "Keep that," says the Dealer. "Things get rubbed out lately."',
    },
    { weight: 2, effect: 'visitor', creature: 'frog', text: 'It stops on a frog. So does a frog, right beside you.' },
    { weight: 2, effect: 'nothing', text: 'A blank wedge. The Dealer says it is the rarest one.' },
    { weight: 1, effect: 'maxHp', amount: 1, text: 'Gold wedge! Something in your chest grows a size. +1 max HP.' },
  ],
};
