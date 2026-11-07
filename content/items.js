// Gegenstände, die man finden kann. Mit atk ist es eine Waffe (atk wird zum Grundangriff addiert),
// mit slot und def ein Rüstungsteil (seit Tag 5: head, body, feet; def wird vom Schaden abgezogen),
// sonst kommt es in den Beutel (player.bag). Gleiche Dinge dürfen mehrfach im Beutel liegen.
// text = Beschreibung im Fenster [ GEAR ].
export const ITEMS = {
  stick: {
    name: 'stick',
    atk: 1,
    hitVerb: 'whack',
    text: 'Very straight. Suspiciously so.',
  },
  'pointy-rock': {
    name: 'pointed rock',
    text: 'Pointy at one end. The other end is also a bit pointy.',
  },
  'stone-spear': {
    name: 'stone spear',
    atk: 3,
    hitVerb: 'jab',
    text: 'A stick with ambitions.',
  },
  // Tag 4: Frösche husten sie manchmal aus. Am Glücksrad gilt ein Knopf als Einsatz.
  button: {
    name: 'button',
    text: 'Four holes. The wheel likes them. So does the workbench, in threes.',
  },
  // Tag 4: vom Glücksrad, höchstens einer. Noch ohne Zweck.
  'pencil-stub': {
    name: 'pencil stub',
    text: 'Short, chewed, still sharp. The Dealer said to keep it.',
  },
  // Tag 5: graue Krümel aus der ausradierten Ecke. Der Keeper will sie sehen (Quest "Grey Crumbs").
  crumb: {
    name: 'grey crumb',
    text: 'Rubbery, grey, faintly warm. The Keeper might know what it is.',
  },
  // Tag 5: Belohnung der Quest. Öffnet das Gitter zum Sumpf in den Kanälen.
  'keeper-key': {
    name: "Keeper's key",
    text: 'Old and heavy. The Keeper says it fits something under the meadow.',
  },
  // Tag 5: Rüstung. def wird vom Schaden abgezogen, mindestens 1 Schaden bleibt.
  colander: {
    name: 'colander',
    slot: 'head',
    def: 1,
    text: 'Worn on the head. Lets the rain through, but not the frogs.',
  },
  'button-mail': {
    name: 'button mail',
    slot: 'body',
    def: 1,
    text: 'Buttons sewn onto buttons. Clicks when you walk.',
  },
  'rubber-boots': {
    name: 'rubber boots',
    slot: 'feet',
    def: 1,
    text: 'Squeaky. Nothing bites through them, though plenty tries.',
  },
  // Tag 5: Beute des ersten Bosses, des Krümelhaufens.
  'drain-hook': {
    name: 'drain hook',
    atk: 5,
    hitVerb: 'hook',
    text: 'Long, bent, and very good at pulling things out of other things.',
  },
};
