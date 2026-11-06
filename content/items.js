// Gegenstände, die man finden kann. Mit atk ist es eine Waffe (atk wird zum Grundangriff addiert),
// ohne atk kommt es in den Beutel (player.bag). Gleiche Dinge dürfen mehrfach im Beutel liegen.
export const ITEMS = {
  stick: {
    name: 'stick',
    atk: 1,
    hitVerb: 'whack',
  },
  'pointy-rock': {
    name: 'pointed rock',
  },
  'stone-spear': {
    name: 'stone spear',
    atk: 3,
    hitVerb: 'jab',
  },
  // Tag 4: Frösche husten sie manchmal aus. Am Glücksrad gilt ein Knopf als Einsatz.
  button: {
    name: 'button',
  },
  // Tag 4: vom Glücksrad, höchstens einer. Noch ohne Zweck.
  'pencil-stub': {
    name: 'pencil stub',
  },
};
