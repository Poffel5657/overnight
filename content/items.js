// Gegenstände, die man finden kann. Mit atk ist es eine Waffe (atk wird zum Grundangriff addiert),
// mit slot und def ein Rüstungsteil (seit Tag 5: head, body, feet; def wird vom Schaden abgezogen),
// sonst kommt es in den Beutel (player.bag). Gleiche Dinge dürfen mehrfach im Beutel liegen.
// Mit heal (seit Tag 6) lässt es sich im Fenster [ BAG ] benutzen: heilt so viele HP und ist dann weg.
// text = Beschreibung im Fenster [ BAG ].
// stat (seit Tag 7): jedes Stück, das man bekommt, erhöht state.stats[stat] um 1 (zum Beispiel für Events).
// spell (seit Tag 7): ein Buch, das einen Zauber aus content/spells.js lehrt, solange man es dabeihat.
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
  // Tag 6: Federn aus Mainspring. Uhrwerkmäuse verlieren sie, Tinker und Mayor wollen sie haben.
  spring: {
    name: 'spring',
    text: 'A little coiled spring. It wants very badly to be wound into something.',
  },
  // Tag 6: Belohnung der Quest "Loose Springs" beim Tinker.
  wrench: {
    name: 'brass wrench',
    atk: 4,
    hitVerb: 'clonk',
    text: 'Heavy at the business end. Tightens bolts and loosens opinions.',
  },
  // Tag 6: Beute der Overwound Clock, die man besser nicht allein angeht.
  'brass-helm': {
    name: 'brass helm',
    slot: 'head',
    def: 2,
    text: 'Made from the face of a clock. It still ticks, very quietly, near your ear.',
  },
  // Tag 6: Geschenk der Vogelscheuche, weil die Wache gehalten hat (Event "The Smudge Watch").
  'straw-hat': {
    name: 'spare straw hat',
    slot: 'head',
    def: 1,
    text: 'The Scarecrow\'s spare. They made it first, and then they made another one.',
  },
  // Tag 6: Ware am Stand des Dealers. heal = so viele HP, wenn man es im Fenster [ BAG ] benutzt.
  tonic: {
    name: 'fizzy tonic',
    heal: 5,
    text: 'Green, fizzy, slightly warm. The label is not painted in yet.',
  },
  'strong-tea': {
    name: 'strong tea',
    heal: 12,
    text: 'A flask of tea so strong the spoon stands up. Mends almost anything.',
  },
  // Tag 7: Tinte. Hält, wo Bleistift nicht hält. Zauber aus dem Turm kosten einen Tropfen.
  ink: {
    name: 'drop of ink',
    stat: 'ink',
    text: 'A bead of ink that refuses to spill. Spells drink it. So, apparently, does the future.',
  },
  // Tag 7: Zauberbücher aus dem krummen Turm (Gewinner von Zettel 6). Wer eins dabeihat, kann den Zauber.
  'tome-ward': {
    name: 'Tome of Warding',
    spell: 'ward',
    text: 'Thin, stern, and bound in something that used to be a fence. Teaches WARD.',
  },
  'tome-hop': {
    name: 'Tome of Hopping',
    spell: 'hop',
    text: 'Most of the pages are blank where the words jumped off. Teaches HOP.',
  },
  'tome-mend': {
    name: 'Tome of Mending',
    spell: 'mend',
    text: 'Smells of tea and sticking plaster. Teaches MEND.',
  },
  // Tag 7: Beute des Great Cog im Uhrturm. Der stärkste Schlag bisher.
  'cog-tooth': {
    name: 'cog tooth',
    atk: 6,
    hitVerb: 'saw at',
    text: 'One tooth of the Great Cog, as long as your arm. It still wants to turn something.',
  },
  // Tag 7: Truhe auf der Insel im Uhrturm, nur mit HOP zu erreichen.
  'brass-greaves': {
    name: 'brass greaves',
    slot: 'feet',
    def: 2,
    text: 'Clockwork shin guards. They tick when you run, and they make you run on time.',
  },
  // Tag 7: Dank der Vogelscheuche, wenn die Krähen endlich erschreckt sind.
  'crow-coat': {
    name: 'crow-feather coat',
    slot: 'body',
    def: 2,
    text: 'Stitched from what the crows left behind. Still slightly inky. They would like it back.',
  },
};
