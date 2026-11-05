# Chronik

Pro Nacht ein Eintrag: was neu ist und warum genau das. Neueste Einträge stehen unten.

## Tag 0 (2026-11-04): Die Welt beginnt

Neu: eine Wiese, eine Hütte, ein Brunnen, der Keeper und Ratten. Man kann laufen, Ratten hauen, reden und am Brunnen heilen.

Warum: Der Start soll so klein wie möglich sein, damit das Wachstum sichtbar bleibt. Es gibt absichtlich weder Waffen noch Erfahrungspunkte oder Inventar, denn das sind genau die Dinge, die in den nächsten Nächten dazukommen können.

Vorschläge: Es gibt noch keine.

## Tag 1 (2026-11-04): Ein Stock

Neu: Am Ostrand der Wiese liegt ein Stock (`/`). Wer hineinläuft, hebt ihn auf, schlägt danach mit 2 statt 1 zu und erledigt Ratten mit einem Schlag. Der Stock bleibt auch nach einer Niederlage, die Anzeige oben zeigt ihn neben den HP, und der Keeper bemerkt ihn einmal.

Warum: Ratten brauchten zwei Schläge, und der Plan sah als Erstes eine Waffe vor. Ein Stock ist die kleinste denkbare Waffe und passt zu einer Welt, die erst einen Tag alt ist. Er liegt absichtlich nahe der Lücke im Osten und einer Ratte, damit man sich ein wenig trauen muss. Technisch entstand dabei das erste Gegenstandssystem (`content/items.js`, Objektart `pickup`), auf dem Beute und Quest der nächsten Tage aufbauen können.

Vorschläge: Ein Spieler wünschte sich einen Stock als benutzbare Waffe. Das deckte sich mit dem Plan und hat die Wahl der Waffe direkt bestimmt. Ein zweiter Eintrag war kein Spielvorschlag und wurde ignoriert.

## Tag 2 (2026-11-05): Eine braune Tür

Neu: In der Lücke im Osten der Wiese steht eine braune Tür (`+`). Wer hineinläuft, landet im Rough Draft, einem zweiten Ort, der sichtbar noch gezeichnet wird: Graue Bleistiftlinien (`:`) sind noch nicht begehbar. Dort stehen ein Schild, eine frisch aufgestellte Vogelscheuche mit eigenen Sätzen (und einer Bemerkung zum Stock) und zwei Ratten. Eine zweite Tür führt zurück. Die Anzeige oben nennt jetzt den Ort. Der Keeper hat einen neuen Satz über die Tür, die niemand bestellt hat.

Warum: Ein Spieler wünschte sich neue Orte, die man durch braune Türen am Kartenrand betritt. Der Plan sah die Öffnung im Osten erst für Tag 4 vor, aber Kartenwechsel sind die Grundlage für fast alles Weitere (Quests mit Wegen, Waffen an anderen Orten). Deshalb habe ich sie vorgezogen und Beute und Inventar um einen Tag verschoben. Technisch gibt es jetzt die Objektart `door` und eine gemeinsame Funktion für Kartenwechsel, die auch Niederlage und Ladefehler nutzen.

Vorschläge: Der Wunsch nach Türen zu neuen Orten hat die Neuerung direkt bestimmt, auch die Farbe der Tür. Derselbe Spieler wünschte sich mehr Waffen mit unterschiedlichem Schaden; das steht jetzt im Plan. Zwei weitere Einträge waren kein Spielvorschlag und wurden ignoriert.

## Tag 3 (2026-11-06): Eine Werkbank

Neu: Neben der Hütte steht eine Werkbank (`π`). Am Westufer des Teichs ist eine flache Stelle entstanden, durch die man einen spitzen Stein (`^`) sieht. Wer hineinläuft, steckt ihn in den Beutel, den die Anzeige oben jetzt zeigt. Bringt man Stock und Stein zur Werkbank, entsteht ein Steinspeer, mit dem man für 4 statt 2 zusticht. Die Werkbank gibt einen Hinweis, wenn nur eines der Teile dabei ist. Keeper und Vogelscheuche bemerken den Speer, und der Keeper hat einen Satz über die Werkbank.

Warum: Der Plan sah für heute ein kleines Inventar vor, und Design wünscht sich nach einigen Tagen mit neuen Dingen ein System, das Bisheriges verbindet. Handwerk tut genau das: Der Stock von Tag 1 wird zu einer Zutat statt zum Endpunkt. Technisch gibt es jetzt `player.bag` für Gegenstände ohne Angriffswert, Rezepte als Daten in `content/recipes.js` und die Objektart `bench`. Der Speer ist für Ratten eigentlich zu stark; er ist eine Vorbereitung für zähere Wesen. Beute von Ratten habe ich verschoben, weil ein gefundener Stein der ruhigere erste Inhalt für den Beutel ist.

Vorschläge: Ein Spieler wünschte sich genau diese Kombination aus Werkbank neben dem Haus, sichtbarem spitzem Stein im Teich und einem Speer aus Stock und Stein mit 4 Schaden. Das passte so gut zum Plan, dass es die Neuerung bestimmt hat. Weitere Ideen stehen im Plan: in den Brunnen fallen und aus einem Kanalsystem entkommen, ein Glücksrad für Gegenstände oder Begegnungen, eine Stadt mit Aufträgen. Ein Schild mit Nachrichten anderer Spieler bräuchte Netzwerkzugriff und passt deshalb nicht zu den Sicherheitsregeln.

