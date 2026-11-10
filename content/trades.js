// Berufe (seit Tag 8, Gewinner von Zettel 7). Bisher einer: Bergbau.
// Man schlägt mit der Spitzhacke (tool) Erz aus Adern (Objektart vein in content/world.js).
// Jeder Schlag zählt in player.mining. ranks: ab so vielen Schlägen (at) gilt dieser Rang.
//   bonus: Chance auf ein zweites Stück pro Schlag, deep: kann tiefe Adern (deep: true) anschlagen.
// rankUpText: {title} wird ersetzt. Im Fenster [ CHARA ] steht der Beruf unter TRADES.
export const MINING = {
  name: 'Mining',
  tool: 'pick',
  ranks: [
    { at: 0, title: 'Novice', bonus: 0 },
    { at: 6, title: 'Digger', bonus: 0.25 },
    { at: 16, title: 'Pitworker', bonus: 0.4, deep: true },
    { at: 30, title: 'Old Hand', bonus: 0.6, deep: true },
  ],
  xp: 1,
  text: 'Knock ore out of the veins by the gear pits. Each vein gives two strikes a night. Better hands find more.',
  noToolText: 'A vein of something shiny. You would need a pick.',
  deepText: 'Your pick skids off. This vein wants a surer hand. (Mining: Pitworker)',
  rankUpText: 'You are getting the knack of the pick. Mining: {title}.',
  bonusText: 'A second lump comes loose with the first.',
};
