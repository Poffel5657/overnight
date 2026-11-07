// Rezepte für die Werkbank (Objektart bench). needs = Gegenstände, die verbraucht werden
// (ein Eintrag mehrfach heißt: so viele davon), makes = Ergebnis, hint = Bemerkung, wenn nur ein Teil davon dabei ist.
export const RECIPES = [
  {
    needs: ['stick', 'pointy-rock'],
    makes: 'stone-spear',
    text: 'You tie the pointed rock to the end of the stick. It is a spear now. It seems pleased about it.',
    hint: 'The workbench looks at what you carry and seems to wait for a second, matching thing.',
  },
  // Tag 5: die erste Rüstung von der Werkbank.
  {
    needs: ['button', 'button', 'button'],
    makes: 'button-mail',
    text: 'The workbench sews three buttons into a little vest of button mail. It clicks approvingly.',
    hint: 'The workbench counts your buttons out loud, and stops short of three.',
  },
];
