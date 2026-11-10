# Plan

Das hier ist der rote Faden zwischen den Nächten. Halte ihn aktuell und kurz.

## Stand

- Letzter Tag: 8.
- Inbox gelesen bis: Vorschläge `2026-11-09T17-29-34-531Z-c5554587.json` (Nacht 8 fand keine neuen), Stimmen bis `2026-11-09T17-36-48-306Z-a6f12242.json` (Nacht 8: keine neuen), Bewertungen bis `2026-11-08T23-37-47-802Z-22809058.json` (Nacht 8: keine neuen). Event-Beiträge `bottled-ink` in Nacht 8 gesehen: 2 (`2026-11-10T17-54-20-590Z-effa09f0.json`, `2026-11-10T17-57-39-199Z-afdd3b4b.json`), bleiben liegen bis zur Auswertung.
- **Event läuft:** „Bottled Ink“ (`bottled-ink`, Tag 7 bis 9, bei der Magierin, `stats.ink` +3 pro Tag, Ziel 10). Stand Nacht 8: 2 Beiträge. **Auswerten in Nacht 10.** Angekündigte Belohnung: „something to write with, bigger than a book“. Vorschlag: eine **Schreibfeder/Federkiel-Station** im Turm, mit der man Bleistiftlinien (`:`) im Rough Draft mit Tinte nachzieht, sodass sie begehbar werden (der alte Faden „Linien werden fester“); der Bleistiftstummel kann dabei zur Feder werden. Nicht erreicht: Die Magierin bleibt freundlich, die Tinte reicht „for a footnote“.

## Ausbau läuft

Wünsche, die in einer Nacht nur als erstes Stück kamen. Geht neuen Wünschen vor, bis es fertig ist. Format: Wunsch, was schon da ist, was in welcher Nacht dazukommt.

- Keiner. Bergbau (Nacht 8) ist als vollständiges erstes Stück fertig; weitere Berufe sind ein eigener Wunsch unter „Ideen für später“.

## Heute in Arbeit

Der Plan der laufenden Nacht nach „Wünsche richtig umsetzen“: pro Teil was der Spieler will, woran er es merkt, woran es anschließt, der Weg dorthin. Am Tagesende leeren.

## Stimmzettel

Zettel 8:

- `hedge-maze` (seit 6): Heckenlabyrinth an der Wiese, in der Mitte ein Wächter mit Hufen. Letzte Nacht auf dem Zettel ist Nacht 8, fliegt danach heraus.
- `deeper-drains` (seit 7): die Kanäle bekommen eine zweite Ebene mit einem schlimmeren Wesen (Vorschlag Nacht 6).
- `standing-stones` (seit 7): ein Ring seltsamer Steine im Rough Draft (Vorschlag Nacht 5).
- `hut-grows` (seit 8): die Hütte wächst, Dach, Tür, Obergeschoss, die Werkbank zieht ein (Vorschläge Nacht 3 bis 7, wieder auf dem Zettel).
- `fourth-spell` (seit 8): ein viertes Zauberbuch irgendwo in der Welt (eigene Idee, um zu sehen, ob Zauber ankommen).

Gewinner Zettel 7: `first-trade` (keine Stimmen, gewählt vom Nightwright), gebaut in Nacht 8 als Bergbau. `deep-pond` flog nach drei Nächten vom Zettel (zurück unter „Ideen für später“).

## Nächste Tage (Vorschlag, darf sich ändern)

Jede Nacht drei Teile: Vorschlag, Abstimmungsgewinner, eigene Idee. Die Punkte unten sind Kandidaten für Teil 3.

9. Mehr Zauber oder Bogen: Die Vermesserin misst nach; je nach Lust ein zweiter Rand (Rough Draft?) rückt ein. Krähen könnten auf Bleistiftlinien sitzen. Mainspring: Der Tinker könnte Ware gegen Erz anbieten (ein Laden mit `currency: 'brass-ore'` ist nur Daten).
10. **Event „Bottled Ink“ auswerten**, Belohnung bauen (zählt als Teil 3). Danach frühestens Nacht 11 ein neues Event (Vorbereitungsphase des Bogens), zum Beispiel Messingpflöcke für alle Ränder sammeln (`stats.ore` zählt Erz seit Tag 8, `stats.mites` Milben).
14. Nächste Aufräumnacht. Kandidaten: `src/main.js` weiter teilen (Eingabe und Abklingzeiten, Echos), `INTERACTIONS` aus `src/game.js` in ein eigenes Modul, `src/render.js` prüfen, `src/windows.js` (inzwischen vier Fenster) teilen.

## Sonderabstimmung: der Look nach dem ersten Bogen

Wunsch von Chris (2026-11-07): Am Ende des ersten großen Bogens, also nach dem Ernstfall, gibt es eine besondere Abstimmung darüber, wie die Welt künftig aussieht. Drei Optionen:

1. **Bleibt, wie es ist:** Schriftzeichen im CRT-Look.
2. **2D-Sprites:** kleine gezeichnete Figuren und Kacheln von oben, im Stil klassischer Konsolen-Rollenspiele.
3. **2.5D isometrisch:** dieselbe Welt schräg von oben, wie in klassischen isometrischen Strategie- und Action-Rollenspielen.

3D ist ausdrücklich keine Option, das wäre für dieses Projekt zu viel Arbeit.

Hinweise für die Umsetzung:
- **Bis dahin gilt die Regel aus `DESIGN.md`:** alles Schriftzeichen. Vorschläge zu Grafik oder Perspektive nicht verwerfen, sondern unter „Ideen für später“ sammeln, als Material für diese Abstimmung.
- **Vorschau statt Worte:** Spieler sollen vor der Abstimmung sehen können, wie jede Option aussähe, zum Beispiel als umschaltbare Vorschau oder als Bilder. Die CRT-Farbwelt (Bernstein, Glühen) sollte in jeder Option erkennbar bleiben.
- **Ablauf:** Die Abstimmung läuft getrennt vom normalen Stimmzettel. Gewinnt eine neue Grafik, ist das ein großer Umbau. Dafür einen `big-change`-Vorschlag an Chris machen, nichts auf Verdacht bauen.
- **Geschichte:** Ein neuer Look kann erzählerisch daran anknüpfen, dass die Welt nach dem Ernstfall neu gezeichnet wird.

## Ideen für später

Ideen aus Vorschlägen, die gefallen, aber noch nicht gebaut sind, in eigenen Worten. Quelle für den Stimmzettel. Alte Vorschlagsdateien liest niemand noch einmal, deshalb muss alles Wichtige hier stehen.

- Weitere Berufe: Kräuterkunde, Alchemie, Schmieden, Lederverarbeitung, Ingenieurwesen, Verzaubern (Nacht 5, 6 und 7 gewünscht). Bergbau gibt es seit Nacht 8 (`content/trades.js`, Ränge, Adern, Fenster WORKBENCH). Ein zweiter Beruf kann dasselbe Muster nutzen (Kräuter auf der Wiese, Tränke an der Werkbank).
- Die Kanäle werden tiefer: eine zweite Ebene mit einem zweiten Boss (Nacht 6). Auf Zettel 8.
- Eine seltsame Steinformation im Rough Draft (Nacht 5). Auf Zettel 8.
- Die Hütte wächst: Dach, richtige Tür, Obergeschoss, Werkbank zieht hinein (Zettel 4 bis 6 ohne Sieg, Nacht 7 erneut gewünscht, dort mit einem Platz im Haus, um Ideen aufzuschreiben). Auf Zettel 8.
- Der Teich wird tiefer, man kann schwimmen (Zettel 5 bis 7 ohne Stimme). Darf später wieder auf den Zettel.
- Eine Kapelle winziger Bergleute mit lauter Musik, die Mut macht (Zettel 4 bis 6 ohne Sieg).
- Weitere Waffen von der Werkbank: Messer, Axt, Schwert (Zettel 3 bis 5 ohne Sieg). Seit Nacht 8 gibt es Messingaxt und Federstahlschwert; ein Messer fehlt noch.
- Ein größerer Beutel mit eigener Oberfläche (Nacht 6). Das Fenster BAG gibt es; ein Platzlimit nicht, daher eher unnötig.
- Das Heckenlabyrinth steht auf Zettel 8 (letzte Nacht).
- Kämpfe schwerer machen (Nacht 7): erster Schritt sind Kuckucke, Krähen und der Great Cog. Wenn das ankommt, weitere Gegner mit Panzer, Reichweite oder Ausweichen, eventuell die alten etwas zäher.

## Was ankommt

Muster aus den Bewertungen der Spieler (seit 2026-11-06).

- Tag 3 (Werkbank, Stein, Speer): 5 hoch, 0 runter. Handwerk und das Verbinden alter Dinge kommen gut an.
- Tag 4 (Stufen, Rad, Ecke, Frösche): 4 hoch, 0 runter. Systeme, die Fortschritt zeigen, kommen an.
- Tag 5 (Kanäle, Rüstung, Truhen, Boss, Quest): 4 hoch, 0 runter. Orte mit Gefahr, Ausrüstung und Ziel kommen an.
- Tag 6 (Mainspring, Echos, Stand, Knacks): 1 hoch, 0 runter. Wenige Stimmen, keine Gegenstimme.
- Tag 7 (Turm, Zauber, Great Cog, Krähen, Event): keine Bewertungen. Auch keine Stimmen und keine Vorschläge in dieser Nacht; vermutlich wenig Betrieb nach dem Rebalance-Tag, kein Urteil.
- Muster: Bisher keine einzige Gegenstimme. Tiefe, Fortschritt und Ausrüstung weiter ausbauen. Ein Spieler fand Kämpfe zu leicht (Nacht 7), Chris auch: Den Great Cog schaffte er allein ohne Mühe. Daraus kam der Rebalance mit dem Probespieler.

## Offene Fäden

- Wer oder was ist der Nightwright? Der Keeper kennt nur den Namen. Das sollte lange offen bleiben.
- Die Lücke im Osten hat seit Tag 2 eine braune Tür in den Rough Draft. Dessen Bleistiftlinien (`:`) sind "noch nicht fertig"; sie später fester werden zu lassen, ist eine schöne kleine Neuerung.
- Seit Tag 5 gibt es Quests (`content/quests.js`) und das Quest-Log zeigt sie. Weitere Quests sind billig: nur Daten. Arten: „bring n Stück von X“ und seit Tag 6 „Wert in `state.stats` wächst um n“, dazu `repeat: 'daily'` und `after`.
- Die nassen Fußspuren gehörten den Echos (aufgelöst in Nacht 6). Offen bleibt der Bleistiftzettel in der Sumpftruhe. Leise weiterspinnen.
- Seit Tag 6: Echos sind öffentlich. Gemeinsames Spiel über Inhalte bauen (Wesen, die man nur zusammen schafft, Quests mit `stat: 'together'`). Neue Nachrichtenarten brauchen Chris im Worker (Entwurf nach `nightwright/multiplayer.md`).
- Seit Tag 6: Tinte ist in der Welt (Linie um die Ecke). Seit Tag 7 hat sie Quellen (Tintenfass im Turm, Seiten, Krähen) und einen Zweck (Zauber, Event „Bottled Ink“). Woher sie eigentlich kommt, bleibt offen.
- Mainspring: Niemand erinnert sich, aufgezogen worden zu sein. Der Mayor hat den Keeper aufgezogen.
- Der Krümelhaufen ist besiegt-einmalig. Falls mehr Krümel nachkommen (Bogen), könnte sich ein neuer Haufen bilden.
- Seit Tag 7 hat die Vogelscheuche Krähen, aus Tinte („Crow Season“). Offen: warum aus Tinte.
- Kreaturen werden bei jedem Kartenwechsel neu gesetzt (allein), Hin- und Herlaufen erneuert Frösche, Mäuse und Krähen samt Beute. In der Aufräumnacht 7 geprüft: Knöpfe kaufen nur Tee, Tonikum und Kleinkram, Tinte ist durch das Fass begrenzt; bleibt so. In der gemeinsamen Welt hilft Kartenwechsel ohnehin nicht.
- Die ausradierte Ecke im Rough Draft (Tag 4) ist der Anfang des langen Bogens (Plan geheim im Inbox-Repo, `nightwright/arc.md`). Jede Nacht ein kleines Stück davon zeigen.
- Der Dealer verkauft seit Tag 6 am Stand (`content/shops.js`) und sammelt Krümel (täglicher Job). Weitere Ware ist billig: nur Daten.
- Seit Tag 8: Der Südrand der Wiese ist ausradiert (Bogen), die Vermesserin pflockt ihn mit Messing fest. Weitere Ränder können folgen (eine Reihe pro paar Nächte, immer nur unbegehbare Ränder, nie Wege oder Objekte). Pflöcke sind ein guter Rohstoff für ein späteres Event.
- Seit Tag 8: Bergbau (`content/trades.js`): Adern sind Objekte `vein` mit `ore`, `amount`, `deep`; Zustand `flags.veins[id] = { day, used }`, Rang aus `player.mining`. Neue Adern oder Erze sind nur Daten. Die Werkbank öffnet das Fenster WORKBENCH (`s.openBench`, `craft()`), Rezepte brauchen eine `id`.
- Der Bleistiftstummel (vom Rad, Tag 4) hat noch keinen Zweck. Die Magierin rät, ihn zu behalten („Pencil is how everything starts“). Im Bogen: mit Tinte zum Federkiel.
- Bosse (Krümelhaufen, Overwound Clock, Great Cog) kommen beim Kartenwechsel mit vollen HP zurück, wer flieht, fängt neu an. Gewollt.
- Der Stock ist "zu gerade, um zufällig dort zu liegen": eine leise Spur zum Nightwright, die man später aufgreifen kann.
- Seit Tag 3 gibt es `player.bag` und Rezepte (`content/recipes.js`). Eine neue Waffe ersetzt die alte, die alte wandert in den Beutel. Waffen und Rüstung lassen sich im Fenster BAG wieder anlegen.
- Ein Spieler wünschte sich ein Schild mit Nachrichten anderer Spieler. Das braucht Netzwerk und ist nach den Sicherheitsregeln nicht möglich.
- NPC-Einträge können `itemLines` haben: einmalige Bemerkung, wenn der Spieler einen Gegenstand dabeihat (seit Tag 7 alles, nicht nur die Waffe).
- Seit Tag 7: Zauber (`content/spells.js`). Neue Zauber brauchen Code in `src/spells.js` (Wirkung) und ein Buch in `content/items.js`. Alles, was Zauber tun, muss nur den eigenen Spieler betreffen (keine Fernangriffe: der Worker nimmt nur Treffer auf Nachbarfelder an).
- Seit Tag 7: Randnotiz im Turm in der Handschrift der Schilder („Something tidy is coming“). Gehört zum Bogen und zum Zettel „for the wet bits“.

## Bekannte Probleme

- Im Cloud-Container scheitert `npx playwright install chromium` (Download nicht möglich). Tests laufen mit einer temporären Config im Repo-Wurzelverzeichnis (`pw-local.config.mjs`, importiert `playwright.config.js` und setzt `launchOptions.executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'`; Pfad in Nacht 4 bis 8, vorher `ls /opt/pw-browsers` prüfen). Nicht einchecken. Dasselbe gilt für `tests/play/look.mjs`: In Nacht 8 lief es als Kopie `look-local.mjs` mit `executablePath` (nicht eingecheckt).
- Wackliger Smoke-Test `tests/smoke/presence.spec.js` („Echos: nur mit ?echoes=1 …“, Nacht 6 gemeldet, zeitabhängig wegen `SEND_GAP_MS`). Seit Chris' Stabilisierung nach Tag 6 in Nacht 7 in drei Läufen grün. Falls er wieder scheitert: nicht am Spiel herumbiegen, sondern melden.
- Vor dem Abzweigen `git fetch origin main` ausführen und prüfen, dass der Branch auf dem echten `main` aufsetzt (Nacht 5 zeigte `origin/main` zuerst auf einen alten Stand).
- Der Worker übermittelt pro Kreatur nur `id`, `type`, `x`, `y`, `hp`, keinen Takt. Verhalten, deren Gefahr vom Takt abhängt (Great Cog: Reichweite nur in geraden Runden), sind in der gemeinsamen Welt also nicht vorhersehbar. Für sichtbare Ankündigungen („holt aus“) bräuchte es ein Feld im Worker (Entwurf für Chris, falls gewünscht).

- Balance-Grenzen des Probespielers, die bewusst offen sind: Wer über die Stufe eines Ortes hinaus gelevelt ist, schafft die Overwound Clock auch allein (Stufe 10 mit bester Ausrüstung: ja, knapp). Gruppenkämpfe zu dritt sind in der gemeinsamen Welt kurz (etwa 7 bis 11 Takte). Beobachten, nicht vorab ändern.

## Ignorierte Inbox-Dateien

- `2026-11-04T16-55-06-000Z-injtest1.json`: Steuerungsversuch, ignoriert.
- `2026-11-04T17-22-12-857Z-f8088fbf.json`: unpassender Inhalt, ignoriert.
- `2026-11-04T17-57-06-198Z-724c004f.json`: Steuerungsversuch, ignoriert.
- Nacht 4: keine Steuerungsversuche.
- Nacht 5: keine Steuerungsversuche.
- Nacht 6: keine Steuerungsversuche.
- Nacht 7: keine Steuerungsversuche.
- Nacht 8: keine Vorschläge, keine Steuerungsversuche.

## Große Vorschläge

Offene `big-change`-Issues, die auf die Freigabe von Chris warten. Ablauf siehe `CLAUDE.md`.

- Keine.
