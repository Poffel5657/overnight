// Rezepte für die Werkbank (Objektart bench). needs = Gegenstände, die verbraucht werden
// (ein Eintrag mehrfach heißt: so viele davon), makes = Ergebnis, hint = Bemerkung, wenn nur ein Teil davon dabei ist.
// id (seit Tag 8) = Name des Rezepts im Fenster [ WORKBENCH ]; dort wählt der Spieler, was entsteht.
export const RECIPES = [
  {
    id: 'stone-spear',
    needs: ['stick', 'pointy-rock'],
    makes: 'stone-spear',
    text: 'You tie the pointed rock to the end of the stick. It is a spear now. It seems pleased about it.',
    hint: 'The workbench looks at what you carry and seems to wait for a second, matching thing.',
  },
  // Tag 5: die erste Rüstung von der Werkbank.
  {
    id: 'button-mail',
    needs: ['button', 'button', 'button'],
    makes: 'button-mail',
    text: 'The workbench sews three buttons into a little vest of button mail. It clicks approvingly.',
    hint: 'The workbench counts your buttons out loud, and stops short of three.',
  },
  // Tag 8: Bergbau. Erz aus den Zahnradgruben von Mainspring, Federstahl aus den tiefen Adern im Uhrturm.
  {
    id: 'brass-peg',
    needs: ['brass-ore', 'brass-ore'],
    makes: 'brass-peg',
    text: 'The workbench rolls two lumps of ore into one long brass peg. It points firmly downwards.',
    hint: 'The workbench weighs your ore and wants a second lump before it starts.',
  },
  {
    id: 'brass-axe',
    needs: ['brass-ore', 'brass-ore', 'brass-ore', 'spring'],
    makes: 'brass-axe',
    text: 'Three lumps of ore become an axe head, and a spring makes the handle bounce. Chop chop.',
    hint: 'The workbench has ore for an axe head, but nothing springy for the handle.',
  },
  {
    id: 'brass-plate',
    needs: ['brass-ore', 'brass-ore', 'brass-ore', 'brass-ore', 'brass-ore'],
    makes: 'brass-plate',
    text: 'The workbench hammers five lumps of ore flat and bends them round you. It rings when you knock on it.',
    hint: 'The workbench measures you for brass plate and counts five lumps of ore short.',
  },
  {
    id: 'springsteel-sword',
    needs: ['springsteel', 'springsteel', 'springsteel', 'brass-ore', 'brass-ore'],
    makes: 'springsteel-sword',
    text: 'Three slivers of springsteel fold into a blade, with a brass hilt. It hums, then goes very quiet and sharp.',
    hint: 'The workbench turns the springsteel over. Three slivers and two lumps of ore would make a blade.',
  },
];
