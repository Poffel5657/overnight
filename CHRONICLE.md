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

Bewertung (nachgetragen in Nacht 6): 4 Daumen hoch, 0 runter. Kanäle, Rüstung, Boss und Quest kamen an.

## Tag 6 (2026-11-09): Nicht allein, und aufgezogen

Die erste Nacht in der gemeinsamen Welt. Drei Teile, die sich gegenseitig brauchen: Mainspring ist der Ort, die Vorschläge geben ihm Läden, tägliche Gefallen und einen Fähigkeitenbaum, und der Nightwright erzählt, wer die blassen Gestalten sind, und gibt ihnen etwas, das man nur zusammen schafft.

**Teil 1, aus den Vorschlägen: der Stand des Dealers, tägliche Gefallen und Knacks.**
- Der Dealer hat jetzt einen Stand (`=`) neben dem Rad. Hineinlaufen öffnet das neue Fenster `[ SHOP ]`: fizzy tonic (heilt 5, 2 Knöpfe), strong tea (heilt 12, 4 Knöpfe), ein spitzer Stein (3) und ein Sieb (6). Getränke trinkt man im Fenster GEAR mit „Use“. Ware liegt als Daten in `content/shops.js`.
- Quests können täglich wiederkommen (`repeat: 'daily'`): Der Mayor in Mainspring will jede Nacht zwei Federn, der Dealer zwei graue Krümel (erst nach „Grey Crumbs“). Belohnung Knöpfe und etwas Erfahrung, damit der Stand etwas zu tun hat.
- **Knacks**, ein kleiner Fähigkeitenbaum: Jeder Aufstieg über Stufe 1 gibt einen Punkt, den man im Fenster GEAR in Sturdy (+3 max HP), Sharp (+1 Angriff) oder Thick-skinned (+1 Abwehr) steckt, je höchstens drei Ränge. Bei Stufe 10 sind alle neun verteilt. Alte Spielstände bekommen die Punkte ihrer Stufe nachträglich.
- Einfluss: Ein Spieler wünschte sich, dass der Dealer Tränke und Material verkauft und wiederholbare Aufgaben gibt; ein anderer einen Baum, in dem man Angriff und Abwehr selbst steigert. Beides fast vollständig gebaut. Ein dritter wünschte sich eine Stadt mit Berufen (Bergbau, Kräuter, Alchemie …), tiefere Kanäle mit zweitem Boss und einen größeren Beutel: Die Stadt kam über die Abstimmung, der zweite Boss steht in Mainspring, die Berufe sind notiert. Außerdem notiert: ein Magierturm mit Lehrling und Zaubern aus Büchern, ein Heckenlabyrinth mit einem Zentauren, dessen Tritten man ausweichen muss. Beide stehen jetzt auf dem Stimmzettel.

**Teil 2, aus der Abstimmung: Mainspring.** Zettel 5: Stadt aus Dampf und Zahnrädern 4 Stimmen, Hütte wächst 1, weitere Waffen 0, Zwergenkapelle 0, tieferer Teich 0. Hinter einem tickenden Messingtor in den westlichen Bäumen der Wiese liegt **Mainspring** (30 x 13): Messing, Kopfsteinpflaster, Zahnradgruben (`%`) und ein Uhrturm. Der **Tinker** (`T`) repariert die Stadt und will drei Federn („Loose Springs“), dafür gibt es den **Messingschraubenschlüssel** (Angriff +4, ein Stück vom Wunsch nach mehr Waffen). Der **Mayor** (`M`) hat einen Schlüssel im Rücken und den täglichen Gefallen. Im Winding Yard im Osten laufen **Uhrwerkmäuse** (`m`, 3 HP, verlieren Federn), und dort wartet die **Overwound Clock** (`Ø`, 60 HP, schlägt mit 5), zu fest aufgezogen und ausdrücklich nicht für einen allein gedacht. Sie hinterlässt einen **Messinghelm** (Abwehr 2).

**Teil 3, vom Nightwright: die Echos, „Many Hands“ und die Tinte.**
- Die Enthüllung: Die nassen Fußspuren in den Kanälen waren keine Geister. Der Nightwright hat mehr als einen Wanderer in dieselbe Welt gezeichnet, die Bewohner nennen sie **Echoes**. Das Schild auf der Wiese ist mit Bleistift korrigiert („Population: you, and the Echoes“), die Fußspuren haben jetzt jede Größe, Keeper, Vogelscheuche und Dealer reden darüber.
- Spielbar: Der Keeper gibt nach „Grey Crumbs“ die Quest **„Many Hands“**: drei Kreaturen zusammen mit einem Echo besiegen (beide müssen treffen). Dafür zählt `stats.together`, und Quests können jetzt statt Gegenständen einen Wert aus `state.stats` verlangen. Belohnung: zwei Flaschen Tee und 8 XP. Die Overwound Clock ist das passende Gegenstück: ein Boss, der zusammen viel leichter ist.
- Event-Belohnung: Die Wache hat gehalten. Um die ausradierte Ecke zieht sich jetzt eine Tintenlinie (`|`), und sie hat sich keinen Zoll weiter ausgebreitet. Die Vogelscheuche schenkt jedem, der vorbeikommt, einmal ihren Ersatzhut (Abwehr 1) und 5 XP. Figuren können dafür jetzt ein einmaliges `gift` haben.

Warum: Die Abstimmung war eindeutig, und die gemeinsame Welt geht heute live. Mainspring gibt allen einen neuen Ort, an dem man sich trifft, und die Bewertungen (Tag 3 bis 5 nur Daumen hoch) und Wünsche zeigen, dass Tiefe ankommt: Ausrüstung, Fortschritt, Bosse. Der Stand gibt den Knöpfen endlich einen Zweck, die täglichen Gefallen einen Grund, jede Nacht wiederzukommen.

Community-Event: „The Smudge Watch“ ist ausgewertet: 13 Beiträge bei Ziel 6, erreicht. Belohnung gebaut (Tinte, Hut). Kein neues Event heute (frühestens Nacht 7).

Bewertung von Tag 5: 4 hoch, 0 runter.

Nicht neu, aber gefunden: Das Quest-Log blieb ohne laufendes Event unsichtbar, wenn eine Quest neu hinzukam (der neue Eintrag galt nicht als Änderung). Behoben in `src/quests.js`.

Problem: Der geschützte Smoke-Test `tests/smoke/presence.spec.js` („Echos: nur mit ?echoes=1 …“) ist zeitabhängig. Seine vier Züge vom Start in der Hütte enden wieder auf dem Startfeld; kommen sie innerhalb von 150 ms nach der ersten Positionsmeldung, schickt die Drosselung keine neue Position, und der Test wartet vergeblich. Auf unverändertem `main` scheitert er hier etwa einmal in drei Läufen, mit Tag 6 öfter. Chris ist informiert.

Bewertung (nachgetragen in Nacht 7): 1 hoch, 0 runter. Wenige Stimmen, aber wieder keine Gegenstimme.

## Tag 7 (2026-11-10): Tinte, und ein sehr großes Zahnrad

Die erste Aufräumnacht. Erst die drei Teile wie in jeder Nacht, dann ein Durchgang über den Code der ersten sieben Nächte. Die drei Teile greifen ineinander: Tinte ist der neue Rohstoff, der Turm macht daraus Zauber, und die Zauber (Hüpfen über Lücken, Bisse abwehren, heilen) sind das Werkzeug gegen die neuen Gegner, bei denen man nachdenken muss.

**Teil 1, aus den Vorschlägen: der Great Cog im Uhrturm und Kämpfe, die Denken verlangen.**
- Der Uhrturm in Mainspring hat eine Tür. Drinnen (20 x 11) dreht sich der **Great Cog** (`☼`, 120 HP, schlägt mit 6): festgeschraubt, gepanzert (zieht 2 von jedem Schlag ab) und seine Zähne reichen in jeder zweiten Runde zwei Felder weit in gerader Linie. Schräg daneben ist man sicher. Er ist als Boss für eine Gruppe gedacht; allein geht es nur mit Zaubern und Tee. Beute: ein **Zahn** des Cog (Waffe, Angriff +6, die stärkste bisher).
- **Kuckucke** (`y`) spucken Zahnräder aus bis zu vier Feldern, aber nur bei freier gerader Linie. Wer nah kommt, vor dem weichen sie aus, also treibt man sie in eine Ecke oder stellt sich so, dass etwas dazwischen steht.
- Auf einer Insel aus Zahnrädern steht eine Truhe mit **Messingbeinschienen** (Abwehr 2), nur mit dem Zauber HOP erreichbar.
- Kreaturen können jetzt Panzer (`def`) und Reichweite (`reach`) haben. Neue Verhalten `aim` (Fernkampf in gerader Linie) und `grind` (festgeschraubt, Reichweite in geraden Runden).
- Einfluss: Ein Spieler wünschte sich mit dem Mehrspieler einen Grund, mit Freunden zu spielen: einen starken Boss im Uhrturm, ein böses Zahnrad. Ein anderer fand die Kämpfe zu leicht, alles stirbt zu schnell, man muss nicht nachdenken. Beides gebaut. Die alten Gegner sind unverändert (Spieler kennen sie), die Herausforderung steckt in den neuen. Notiert, aber nicht gebaut: Berufe (Bergbau, Kräuter, Schmieden …), die Hütte mit Dach und Tür, ein Ort im Haus, um Ideen aufzuschreiben (das Formular SHAPE TOMORROW gibt es schon).

**Teil 2, aus der Abstimmung: der krumme Turm.** Zettel 6: Magierturm 3 Stimmen, Heckenlabyrinth 1, Hütte 0, Zwergenkapelle 0, Teich 0. Hinter einer krummen Tür in den nördlichen Bäumen der Wiese lehnt **The Crooked Tower**. Die **Mage** (`W`) nimmt Lehrlinge: „Apprentice“ (zwei Tropfen Tinte bringen) gibt das **Tome of Warding**, „Second Lesson“ (drei Zauber wirken) das **Tome of Mending**. Das **Tome of Hopping** liegt in einer Truhe im Turm. Ein **Tintenfass** gibt jede Nacht zwei Tropfen, **lose Seiten** (`¶`) flattern herum und tragen auch Tinte. Hinter Löchern im Boden liegt eine Nische mit einer Randnotiz und einem Tropfen, nur mit HOP zu erreichen.
- **Zauber** (neues System, Daten in `content/spells.js`): Man kann einen Zauber, solange man sein Buch dabeihat. Jeder kostet einen Tropfen Tinte und eine Runde. **WARD** (Taste 1): die nächsten drei Bisse prallen ab, die Figur leuchtet tintenblau. **HOP** (Taste 2, dann eine Richtung): zwei Felder weit über ein Loch, Wasser, eine Grube oder eine Kreatur, nie über Dinge oder Wände. **MEND** (Taste 3): +6 HP. Unter der Karte erscheint dafür eine Zauberleiste mit Tinte und Knöpfen (am Handy: Knopf HOP, dann das Steuerkreuz).
- Zauber laufen nur im Browser und betreffen nur den eigenen Spieler, deshalb funktionieren sie in der gemeinsamen Welt ohne Änderung am Worker.

**Teil 3, vom Nightwright: Krähen aus Tinte und das Event „Bottled Ink“.**
- Die Vogelscheuche wartet seit Tag 2 auf Krähen. Jetzt sind sie da, aus Tinte: **Tintenkrähen** (`v`) im Rough Draft stoßen herab, picken einmal und flattern wieder weg. Man trifft sie, wenn sie landen. Sie lassen Tinte und Knöpfe fallen. Wer mit Tinte zur Vogelscheuche kommt, bekommt „Crow Season“: vier Krähen verjagen, dafür einen **Federmantel** (Abwehr 2).
- **Community-Event „Bottled Ink“** (Tag 7 bis 9, bei der Magierin): Jeder sammelt pro Tag drei Tropfen Tinte, Ziel 10 Tagesbeiträge. Das ist der Beginn der Vorbereitung im langen Bogen. Die Belohnung ist angekündigt („something to write with, bigger than a book“).
- Figuren bemerken jetzt alles, was man dabeihat, nicht nur die Waffe in der Hand (vorher blieben Bemerkungen zu Rüstung stumm).

Warum: Der Turm hat klar gewonnen, und Zauber sind genau die Art Tiefe, die die Bewertungen bisher belohnt haben. Tinte war seit Tag 6 als Faden offen; jetzt hat sie eine Quelle, einen Zweck und ist der Rohstoff für das erste Event der Vorbereitung. Die Vorschläge nach einem Gruppenboss und schwereren Kämpfen passen dazu: Die neuen Gegner verlangen Stellung (gerade Linien meiden), Geduld (Krähen) und Zauber.

Community-Event: „Bottled Ink“ gestartet (Tag 7 bis 9, Ziel 10).

Bewertung von Tag 6: 1 hoch, 0 runter.

### Review der Aufräumnacht

Gelesen: der Code von Tag 1 bis 6 (`git log` seit dem Anfang, ein `day-*`-Tag mit durch 7 teilbarer Nummer gab es noch nicht) und die neuen Teile von heute.

Gefunden und behoben:
- `takeItem()` hätte bei einem Ding, das man gar nicht hat, ein fremdes Rüstungsteil aus demselben Platz genommen. Jetzt nur, wenn genau dieses Teil getragen wird.
- Ein Spielstand mit kaputten HP (keine Zahl) hätte `NaN` HP ergeben; ebenso kaputtes `maxHp`. Beides fällt jetzt auf sinnvolle Werte zurück.
- `itemLines` reagierten nur auf die Waffe in der Hand. Jetzt auf alles, was man dabeihat (Waffe zuerst), sonst wären die neuen Bemerkungen zu Mantel, Büchern und Zahn nie zu hören gewesen.
- Der Smoke-Test-Kandidat aus Nacht 6 (wackliger Echo-Test) lief diese Nacht in allen Läufen grün.

Aufgeräumt:
- `src/game.js` (über 750 Zeilen) ist in Module geteilt: `src/core.js` (Tag, Event, Zufall, Log, Gelände), `src/inventory.js` (Gegenstände, Ausrüstung, Läden, Knacks, Erfahrung), `src/creatures.js` (Setzen, Bewegen, Verhalten, Bisse), `src/shared.js` (gemeinsame Welt), neu `src/spells.js`. `src/game.js` behält Spielstart, Objekte, Quests, Rad und `act()` und gibt alles weiter, damit Worker, Tests und Browser unverändert importieren.
- Die Fenster CHARA, BAG und SHOP sind aus `src/main.js` nach `src/windows.js` gezogen (main.js von 670 auf unter 500 Zeilen).
- Wiederholtes `random(s) < def.hitChance ? hurtPlayer(…) : false` in allen Verhalten ist jetzt eine Hilfe `strike()`.

Balance: Alte Gegner unverändert. Der Great Cog ist absichtlich nur zu mehreren oder mit Zaubern und Tee zu schaffen. Tinte reicht für das Event: zwei Tropfen aus dem Fass pro Nacht, dazu etwa jede dritte Seite oder Krähe.

Problem: Im Container scheitert `npx playwright install chromium` weiterhin; Tests liefen mit dem vorinstallierten Chromium, alle grün (213, einer übersprungen).


## Nach Tag 7 (2026-11-10): Der große Rebalance (von Chris, keine Nacht)

Die Welt wuchs schnell, aber Kämpfe waren kaum mehr als Laufen. Chris hat den Great Cog, einen Boss für Gruppen, allein und ohne Mühe gelegt. Der Grund: Der Nightwright hat bisher nur getestet, ob etwas funktioniert, nie, ob es sich richtig spielt.

**Der Probespieler** (`tests/balance/`) spielt jetzt jeden Kampf nach, mit der Ausrüstung, die man an diesem Ort realistisch hat (`content/balance.js`, `STAGES`): allein rundenweise und in der gemeinsamen Welt im Takt, allein und zu dritt. Er probiert mehrere Taktiken (hinlaufen und hauen, zuschlagen und ausweichen, warten, zwischen zwei Takten zuschlagen) und nutzt Getränke, MEND und WARD. Jede Kreatur hat eine Rolle (`fodder`, `normal`, `boss`, `group`), und der Test verlangt, dass der Kampf dazu passt.

Vorher (bester Spieler am jeweiligen Ort):
- Alle Kreaturen in der gemeinsamen Welt: 100 % Siege, 0 % HP verloren. Man schlug öfter zu, als die Kreatur zurückbiss (Schlag alle 500 ms, Takt 700 ms), und konnte zwischen zwei Takten zuschlagen und wegtreten.
- Krümelhaufen, Overwound Clock, Great Cog allein rundenweise: 100 % Siege bei 8 bis 14 % HP.
- Kuckucke rundenweise: 0 % (wichen jedes Mal aus, man holte sie nie ein), Krähen 3 %.

Geändert, mit Grund:
- **Rüstung fängt höchstens die Hälfte eines Schlags ab** (`mitigate()` in `src/core.js`, auch für den Panzer des Cog). Vorher kam man auf Abwehr 9 und nahm von allem nur noch 1 Schaden.
- **Trinken kostet einen Zug** (`act(s, 'use:<id>')`, in der gemeinsamen Welt die Abklingzeit eines Schlags). Vorher heilte Tee mitten im Kampf umsonst.
- **Ein Schlag pro Takt:** `PRESENCE.tickMs` und `attackMs` beide 600. Kreaturen ziehen etwas schneller, und Zuschlagen und Wegtreten vor dem nächsten Biss geht nicht mehr.
- **Bosse heilen in der gemeinsamen Welt**, wenn sie `WORLD_BOSS_REST` (30) Takte lang niemand trifft. Sonst legt man sie allein durch Ohnmacht, Zurücklaufen und Weiterhauen.
- **Ein Boss zerbricht WARD mit einem Biss.** Vorher hielten vier Tropfen Tinte einen ganzen Gruppenkampf ab.
- **Kuckucke** picken, wenn man daneben steht, und flattern nur jede zweite Runde weg.
- **Flächenangriffe der Bosse:** Alle paar Runden markiert ein Boss Felder rot (`×`, roter Schleier), zwei Runden später schlägt er dort zu, mit viel mehr Wucht als sein Biss. Wer daneben stehen bleibt, verliert. Krümelhaufen: Kreuz um sich (Länge 2). Overwound Clock: abwechselnd alles bis 2 Felder um sich und ein Ring 2 bis 3 Felder entfernt (wer zu weit wegläuft, wird auch erwischt). Great Cog: abwechselnd Kreuz (Länge 3) und alles bis 2 Felder. Die Markierungen sind in `content/creatures.js` eigene Einträge mit `mark: true`, laufen allein und in der gemeinsamen Welt gleich und brauchen keine Änderung am Worker.
- Zahlen: Frosch 14 HP / 3 Angriff / 3 XP, Aal 14 / 5 / 4, Krähe 10 / 4 / 4, Kuckuck 28 / 6 / 4, Krümelhaufen 88 / 8 / 30 (Krümel 9), Overwound Clock 380 / 10 / 45 (Glocke 26), Great Cog 420 / 12 / 60 (Zähne 22). Ratten, Mäuse und Seiten bleiben Kleinvieh.

Nachher (`node tests/balance/report.mjs 80`):

| Kreatur | Rolle | allein rundenweise | allein live | zu dritt live | ohne Ausweichen |
|---|---|---|---|---|---|
| Ratte | fodder | 100 % (6 % HP) | 100 % (6 % HP) | | |
| Frosch | normal | 100 % (18 % HP) | 100 % (18 % HP) | | |
| Aal | normal | 100 % (24 % HP) | 100 % (16 % HP) | | |
| Krähe | normal | 100 % (15 % HP) | 100 % (15 % HP) | | |
| Krümelhaufen | boss | 60 % (93 % HP) | 69 % (93 % HP) | | 14 % allein |
| Maus | fodder | 100 % (0 % HP) | 100 % (0 % HP) | | |
| Overwound Clock | group | 0 % | 0 % | 100 % (42 % HP) | 57 % zu dritt |
| lose Seite | fodder | 100 % (2 % HP) | 100 % (0 % HP) | | |
| Kuckuck | normal | 100 % (37 % HP) | 100 % (17 % HP) | | |
| Great Cog | group | 0 % | 0 % | 100 % (33 % HP) | 10 % zu dritt |

Der Probespieler weicht den Markierungen aus; die letzte Spalte zeigt, wie es ohne Ausweichen ausgeht. Wer weit über seinen Ort hinaus gelevelt ist, kann die Clock allein schaffen; das ist gewollt.

Für die Nächte: `CLAUDE.md` hat einen neuen Abschnitt „Balance: der Probespieler“. Jede neue Kreatur braucht `balance: { stage, role }`, neue Ausrüstung gehört in die Stufen, und der Bericht steht in jedem Chronik-Eintrag.

## Nach Tag 7 (2026-11-10): Wünsche richtig umsetzen (von Chris, keine Nacht)

Wünsche kamen oft als dünnste Version ins Spiel (ein Ding, das nichts tut; ein Fenster, das am Handy kaum geht), und Chris musste nachbessern. Neu in `CLAUDE.md`: der Abschnitt „Wünsche richtig umsetzen“. Pro Nacht ein Vorschlag, aber gründlich; vorher ein Plan unter `Heute in Arbeit` in `PLAN.md` (was der Spieler will, woran er es merkt, woran es anschließt, der Weg dorthin); ein Spielweg-Test; Bilder vom Spiel mit `tests/play/look.mjs`; große Wünsche unter `Ausbau läuft`; in der Chronik „Gewünscht / Geliefert / Fehlt noch“.

`tests/play/purpose.spec.js` prüft, dass jeder Gegenstand einen Zweck und einen Fundort hat. Gefunden: der Bleistiftstummel (Tag 4) tut bis heute nichts; er ist jetzt als Andenken für den langen Bogen markiert (`keepsake`). `look.mjs` fand gleich einen veralteten Hilfetext im Fenster BAG („Using … takes no time“), obwohl Trinken seit dem Rebalance einen Zug kostet; korrigiert.

Nachtrag: Die Zeilengrenze (1000, Aufräumnacht 2000, großer Umbau 3000) ist weg, im Workflow wie in den Regeln. Es bleibt bei drei Teilen pro Nacht, auch mehrere Wünsche, aber jeder richtig. Freigabe durch Chris braucht nur noch, was das Grundwesen des Spiels ändert (Look, Zugsystem, gemeinsame Welt, alte Spielstände).
