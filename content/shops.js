// Läden (seit Tag 6). Ein Objekt der Art shop mit shop: '<id>' öffnet im Browser das Fenster [ SHOP ].
// stock: was es zu kaufen gibt, price = so viele Stück von currency (eine Gegenstands-ID).
// Kaufen kostet keine Runde. greeting steht oben im Fenster, openText im Log beim Hineinlaufen.
export const SHOPS = {
  dealer: {
    name: "The Dealer's stall",
    currency: 'button',
    greeting: 'Painted in at last. Mostly. Prices in buttons, no refunds, no questions, some answers.',
    openText: 'The Dealer whisks a cloth off the stall. "Finally painted. Have a look."',
    stock: [
      { item: 'tonic', price: 2 },
      { item: 'strong-tea', price: 4 },
      { item: 'pointy-rock', price: 3 },
      { item: 'colander', price: 6 },
    ],
  },
};
