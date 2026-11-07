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


Bewertung (nachgetragen in Nacht 4): 5 Daumen hoch, 0 runter. Handwerk und das Verbinden alter Dinge kommen an.

## Tag 4 (2026-11-07): Ein Rad und ein Fleck

Die erste Nacht mit drei Teilen.

**Teil 1, aus den Vorschlägen: Stufen, Frösche und der Dealer.** Siege geben jetzt Erfahrung (Ratten 1, Frösche 2). Mit genug Erfahrung steigt man eine Stufe auf (bis Stufe 10): Jede Stufe gibt 2 max HP und heilt ganz, jede zweite ab Stufe 3 einen Angriffspunkt. Die Anzeige zeigt `LV` und `XP`. Im Rough Draft leben jetzt „smudged frogs“ (`f`): 5 HP, sie stoßen mit 2 Schaden zu, sitzen jede zweite Runde still und springen dann zwei Felder. Der Speer braucht für sie zwei Stiche, endlich lohnt er sich. Frösche lassen manchmal einen Knopf fallen. Neben dem Rad steht der Dealer (`$`), der genau weiß, was er verkauft, nur ist es noch nicht fertig gemalt. Der Beutel zählt gleiche Dinge zusammen („button x2“).
Ein Spieler wünschte sich mutierte Kanalfrösche mit doppelt so viel Erfahrung wie Ratten, eine Erfahrungsleiste und Stufen; ein anderer einen zwielichtigen Händler im zweiten Ort, dessen Ware noch gemalt wird. Beides passte zu „ein zäheres Wesen“ aus dem Plan und zu Design („Stufen“ als verbindendes System). Nicht gebaut: das nächtliche Zurücksetzen der Stufen und die Bestenliste, denn die bräuchte Netzwerkzugriff, und Fortschritt soll bleiben.

**Teil 2, aus der Abstimmung: das Glücksrad.** Zettel 3: Glücksrad 4 Stimmen, Dampfstadt 3, Brunnen-Kanäle 1, weitere Waffen 0. Das Rad (`¤`) steht beim Dealer, dreht einmal pro Nacht umsonst und danach für je einen Knopf. Es gibt Erfahrung, Heilung, Knöpfe, einmalig einen Bleistiftstummel, einen Frosch als Besucher (kommt nach dem Sieg nicht wieder), ein leeres Feld oder selten +1 max HP. Die Felder liegen als Daten in `content/wheel.js`.

**Teil 3, vom Nightwright: die ausradierte Ecke.** Unten rechts im Rough Draft fehlt ein Stück Welt (`░`): nicht unfertig, sondern ausradiert, mit Krümeln. Die Vogelscheuche ist sicher, dass das nicht der Nightwright war, „the Nightwright only ever adds“. Die Frösche kamen von dort. Das ist der erste sichtbare Schritt des langen Bogens. Der Bleistiftstummel vom Rad hat noch keinen Zweck.

Community-Event: Geplant war „The Smudge Watch“ (Erfahrung sammeln für die Vogelscheuche), aber ein laufendes Event lässt den geschützten Smoke-Test `game.spec.js` scheitern, weil der Zählerabruf an den Worker als externe Anfrage gilt. Deshalb kein Event, Problem an Chris gemeldet.

Bewertung (nachgetragen in Nacht 5): 4 Daumen hoch, 0 runter. Stufen, Rad und Ecke kamen an.

Vorschläge außerdem: eine Stadt mit Bewohnern (stützt `clockwork-town` auf dem Zettel), die Hütte wächst um Dach und Obergeschoss mit Werkbank drinnen, ein tieferer Teich zum Schwimmen, eine Zwergenkapelle mit sehr lauter Musik, die Mut macht. Hütte und Kapelle stehen jetzt auf dem Zettel, Schwimmen unter „Ideen für später“. Eine isometrische Ansicht passt nicht zu einer Welt aus Schriftzeichen und wurde verworfen.

## Tag 5 (2026-11-08): Hinunter in den Brunnen

Drei Teile, die ineinandergreifen: Die Kanäle sind der Ort, Rüstung und Boss füllen ihn, die Quest des Keepers öffnet den letzten Raum.

**Teil 1, aus den Vorschlägen: Rüstung, Truhen, das Fenster GEAR und der erste Boss.** Es gibt jetzt drei Rüstungsplätze (Kopf, Körper, Füße). Rüstung zieht ihre Abwehr vom Schaden jedes Treffers ab, ein Punkt geht immer durch. Ein Durchschlag liegt in einer Truhe in den Kanälen, Gummistiefel in einer zweiten Truhe im Sumpf, und die Werkbank näht aus drei Knöpfen Knopfpanzer (Rezepte können jetzt mehrere gleiche Zutaten verlangen). Neu ist das Fenster `[ GEAR ]` (Knopf unter der Karte oder Taste I): Stufe, Erfahrung, HP, Angriff, Abwehr, was man trägt, und der Beutel mit Beschreibungen. Waffen und Rüstung aus dem Beutel lassen sich dort anlegen, damit ist das alte Problem gelöst, dass ein abgelegter Stock nie wieder in die Hand kam. Im Sumpf wartet der erste Boss, der **Krümelhaufen** (`&`, 30 HP, schlägt mit 5 zu, bewegt sich nur jede zweite Runde). Ohne Rüstung ist er kaum zu schaffen. Wer ihn besiegt, bekommt einen Kanalhaken (Angriff +5), und er kommt nie wieder.
Drei Spieler haben das beeinflusst: Einer wünschte sich Kisten mit Rüstungsteilen, eine Anzeige für Ausrüstung und Werte und einen ersten Gegner, den man nur mit guter Ausrüstung schafft. Ein anderer wollte eine Oberfläche für den Beutel. Ein dritter wollte mehr Möglichkeiten an der Werkbank, um seine Figur auszubauen. Nicht gebaut, aber notiert: tägliche Aufgaben, Sammel- und Handwerksfähigkeiten (Kräuter, Bergbau, Schmieden), eine seltsame Steinformation im Rough Draft und ein Dealer mit großem Sortiment.

**Teil 2, aus der Abstimmung: die Kanäle unter dem Brunnen.** Zettel 4: Brunnen-Kanäle 4 Stimmen, Dampfstadt 1, weitere Waffen 0, Hütte mit Obergeschoss 0, Zwergenkapelle 0. Wer heil ist und trotzdem am Brunnen trinkt, rutscht hinein und landet in **The Drains**, der ersten Karte, die größer ist als der Ausschnitt (32 x 13, die Kamera folgt). Ein Kanal mit zwei Planken teilt sie, es gibt Ratten und **Kanalaale** (`e`, bewegen sich nie, beißen aber, wer danebensteht). Eine Leiter führt zurück zum Brunnen, ein Gitter hinauf in den Rough Draft (und von dort wieder hinunter). Wer verletzt ist, wird am Brunnen wie bisher nur geheilt.

**Teil 3, vom Nightwright: die erste Quest, „Grey Crumbs“.** Der Keeper will graue Krümel sehen. Sie liegen am Rand der ausradierten Ecke und in den Kanälen, und Frösche tragen sie manchmal (25 %). Sobald man einen bei sich hat, bietet der Keeper die Quest an. Sie steht dann im Quest-Log mit Fortschritt. Für drei Krümel gibt es 5 XP und den Schlüssel des Keepers, der das Gitter zum Sumpf öffnet. Der Keeper erkennt die Krümel als Radiergummi: Jemand räumt die Welt auf, eine Ecke nach der anderen. Das ist der nächste Schritt des langen Bogens. In den Kanälen gibt es außerdem nasse Fußspuren, die nicht vom Spieler stammen. Technisch gibt es jetzt `content/quests.js`, Quest-Einträge im Quest-Log, die Objektarten `chest` und `gate`, die Verhaltensarten `lurk` und `trudge` und Bosse, die sich der Spielstand merkt.

Warum: Die Abstimmung war eindeutig, und die Kanäle brauchten Inhalt. Die drei Vorschläge passten fast wörtlich zu dem, was ein neuer, gefährlicherer Ort braucht: Rüstung, Truhen, einen Gegner am Ende. Die Quest verbindet die Wiese, den Rough Draft und die Kanäle und bringt den Bogen weiter, ohne zu viel zu verraten.

Community-Event: „The Smudge Watch“ läuft heute noch (letzter Tag 5). Bisher liegen 7 Beiträge vor, Ziel ist 6. Ausgewertet wird in Nacht 6.
