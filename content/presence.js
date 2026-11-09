// Echos: andere Spieler, die gerade in derselben Welt unterwegs sind. Die Verbindung steckt in src/presence.js
// (geschützt), hier stehen nur Daten, die der Nightwright pflegen darf.
//
// fromDay: ab diesem Tag (letzter Eintrag in chronicle.js) verbindet sich das Spiel. Davor nur mit ?echoes=1.
// color:   Farbe der Echos auf der Karte (blasser als der eigene Spieler).
// tickMs:  Takt der gemeinsamen Welt in Millisekunden (mindestens 300). Kreaturen ziehen einmal pro Takt.
//          Der Worker liest den Wert erst nach seinem nächsten Deploy.
// moveMs:  in der gemeinsamen Welt höchstens ein Schritt (oder Gespräch, Truhe …) pro moveMs.
// attackMs: höchstens ein Schlag pro attackMs. Der Worker verwirft schnellere Treffer (mit etwas Spielraum).
//          Seit dem Rebalance gleich tickMs: ein Schlag pro Zug der Kreaturen, wie allein. Kürzer heißt,
//          man haut öfter zu, als die Kreatur zurückbeißt, und kann zwischen zwei Takten zuschlagen und wegtreten.
//          Trinken hat dieselbe Abklingzeit.
//          Allein (ohne Verbindung) gelten beide nicht, dann ist das Spiel rundenbasiert.
export const PRESENCE = {
  fromDay: 6,
  color: '#9c8f74',
  tickMs: 600,
  moveMs: 200,
  attackMs: 600,
};
