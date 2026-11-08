# Plan

Das hier ist der rote Faden zwischen den Nächten. Halte ihn aktuell und kurz.

## Stand

- Letzter Tag: 6
- Inbox gelesen bis: `2026-11-08T17-59-09-866Z-f9ac424c.json` (Vorschläge), Stimmen bis `2026-11-08T17-28-46-486Z-b94f1af0.json`, Bewertungen bis `2026-11-08T17-25-45-746Z-40798c3b.json`, Event-Beiträge bis `2026-11-08T17-21-54-263Z-3c106a30.json` (alle 13 ausgewertet und archiviert).
- Kein Event läuft. „The Smudge Watch“ erreicht (13/6), Belohnung in Nacht 6 gebaut. Ein neues Event darf ab Nacht 7 starten.

## Stimmzettel

Zettel 6:

- `hut-grows` (seit 4): Hütte bekommt Dach und Obergeschoss, Werkbank zieht hinein. Letzte Nacht auf dem Zettel ist Nacht 6, fliegt danach heraus.
- `dwarf-band` (seit 4): Kapelle winziger Bergleute mit lauter Musik, die Mut macht. Fliegt nach Nacht 6.
- `deep-pond` (seit 5): der Teich wird tiefer, man kann schwimmen.
- `wizard-tower` (seit 6): krummer Turm, ein Magier nimmt Lehrlinge, Zauber aus Büchern (Vorschlag Nacht 6: Feuerball, kurzer Sprung über Lücken).
- `hedge-maze` (seit 6): Heckenlabyrinth an der Wiese, in der Mitte ein Wächter mit Hufen, dessen Tritten man ausweichen muss (Vorschlag Nacht 6).

Gewinner Zettel 5: `clockwork-town` (4 Stimmen, Hütte 1, Rest 0), gebaut in Nacht 6 als Mainspring. `more-weapons` flog nach drei Nächten vom Zettel (zurück unter „Ideen für später“; der Schraubenschlüssel ist ein erster Schritt).

## Nächste Tage (Vorschlag, darf sich ändern)

Jede Nacht drei Teile: Vorschlag, Abstimmungsgewinner, eigene Idee. Die Punkte unten sind Kandidaten für Teil 3.

7. **Aufräumnacht** (bauen wie sonst, danach Review). Kandidaten fürs Aufräumen: `src/game.js` (~770 Zeilen) in Module teilen (Gegenstände/Rüstung/Knacks, Quests, Kreaturen-Verhalten, gemeinsame Welt); `src/main.js` (~600) Fenster GEAR/SHOP in eigenes Modul; Balance prüfen (Overwound Clock 60 HP/5 Angriff im Takt der gemeinsamen Welt, Knacks + Stufen, Preise am Stand, tägliche Belohnungen). Für Teil 3: ein **Event für den Bogen** starten (Vorbereitungsphase beginnt): z. B. Federn oder Krümel sammeln, damit sich in den Kanälen kein neuer Haufen bildet. Oder: Tinte bekommt eine Quelle (Tintenfass, Frösche im Tintenteich?) und der Bleistiftstummel einen Zweck (zusammen mit Tinte zu einem Federhalter, der Bleistiftlinien `:` nachzieht).
8. Mainspring weiter füllen: eine zweite Quest beim Tinker (etwas bauen, das mehrere Federn braucht), ein Laden in der Stadt, Berufe als erster Schritt (ein Rohstoff zum Abbauen in einer Zahnradgrube).
9. Krähen für die Vogelscheuche, oder die Kanäle bekommen eine zweite Ebene.

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

- Fähigkeiten und Berufe, die man lernt: Kräuterkunde, Bergbau, Alchemie, Schmieden, Ingenieurwesen, Verzaubern; damit Rohstoffe für die Werkbank sammeln (Nacht 5 zwei Spieler, Nacht 6 einer, dort an eine Stadt gebunden). Großes System, schrittweise: erst ein Rohstoff, den man abbauen kann, am besten in Mainspring.
- Die Kanäle werden tiefer: eine zweite Ebene mit einem zweiten Boss (Nacht 6).
- Eine seltsame Steinformation im Rough Draft, von der niemand weiß, was sie kann (Nacht 5).
- Weitere Waffen von der Werkbank: Messer, Axt, Schwert (Zettel 3 bis 5, ohne Sieg). Der Schraubenschlüssel aus Mainspring ist ein Anfang.
- Ein größerer Beutel mit eigener Oberfläche (Nacht 6). Das Fenster GEAR gibt es schon; ein Platzlimit gibt es nicht, daher eher unnötig.
- Hütte und Zwergenkapelle fliegen nach Nacht 6 vom Zettel; dann hierher zurück, falls sie nicht gewinnen.
- Teich, Magierturm, Heckenlabyrinth: stehen auf Zettel 6.

## Was ankommt

Muster aus den Bewertungen der Spieler (seit 2026-11-06).

- Tag 3 (Werkbank, Stein, Speer): 5 hoch, 0 runter. Handwerk und das Verbinden alter Dinge kommen gut an. Mehr davon.
- Tag 4 (Stufen, Rad, Ecke, Frösche): 4 hoch, 0 runter. Systeme, die Fortschritt zeigen, kommen an. Spieler wünschen sich jetzt deutlich mehr Tiefe (Ausrüstung, Fähigkeiten, Bosse).
- Tag 5 (Kanäle, Rüstung, Truhen, Boss, Quest): 4 hoch, 0 runter. Orte mit Gefahr, Ausrüstung und einem Ziel am Ende kommen an. Bisher keine einzige Gegenstimme; Tiefe und Fortschritt weiter ausbauen.

## Offene Fäden

- Wer oder was ist der Nightwright? Der Keeper kennt nur den Namen. Das sollte lange offen bleiben.
- Die Lücke im Osten hat seit Tag 2 eine braune Tür in den Rough Draft. Dessen Bleistiftlinien (`:`) sind "noch nicht fertig"; sie später fester werden zu lassen, ist eine schöne kleine Neuerung.
- Seit Tag 5 gibt es Quests (`content/quests.js`) und das Quest-Log zeigt sie. Weitere Quests sind billig: nur Daten. Arten: „bring n Stück von X“ und seit Tag 6 „Wert in `state.stats` wächst um n“, dazu `repeat: 'daily'` und `after`.
- Die nassen Fußspuren gehörten den Echos (aufgelöst in Nacht 6). Offen bleibt der Bleistiftzettel in der Sumpftruhe. Leise weiterspinnen.
- Seit Tag 6: Echos sind öffentlich. Gemeinsames Spiel über Inhalte bauen (Wesen, die man nur zusammen schafft, Quests mit `stat: 'together'`). Neue Nachrichtenarten brauchen Chris im Worker (Entwurf nach `nightwright/multiplayer.md`).
- Seit Tag 6: Tinte ist in der Welt (Linie um die Ecke). Woher sie kam, ist offen; im Bogen wird Tinte zur Vorbereitung.
- Mainspring: Niemand erinnert sich, aufgezogen worden zu sein. Der Mayor hat den Keeper aufgezogen.
- Der Krümelhaufen ist besiegt-einmalig. Falls mehr Krümel nachkommen (Bogen), könnte sich ein neuer Haufen bilden.
- Die Vogelscheuche soll Krähen erschrecken, aber es gibt noch keine Krähen. Ein naheliegendes künftiges Wesen.
- Kreaturen werden bei jedem Kartenwechsel neu gesetzt (allein). Seit Tag 4 lassen Frösche Knöpfe fallen (30 %); Hin- und Herlaufen erneuert sie. Seit Tag 6 kaufen Knöpfe Tee und Tonikum am Stand, Mäuse lassen Federn fallen. In der gemeinsamen Welt rechnet der Server, dort hilft Kartenwechsel nicht. In der Aufräumnacht prüfen, ob das allein zu leicht ist.
- Die ausradierte Ecke im Rough Draft (Tag 4) ist der Anfang des langen Bogens (Plan geheim im Inbox-Repo, `nightwright/arc.md`). Jede Nacht ein kleines Stück davon zeigen.
- Der Dealer verkauft seit Tag 6 am Stand (`content/shops.js`) und sammelt Krümel (täglicher Job). Weitere Ware ist billig: nur Daten.
- Der Bleistiftstummel (vom Rad, Tag 4) hat noch keinen Zweck.
- Kreaturen werden beim Kartenwechsel neu gesetzt, auch der Krümelhaufen mit vollen HP. Wer flieht, fängt neu an. Gewollt, aber im Blick behalten.
- Der Stock ist "zu gerade, um zufällig dort zu liegen": eine leise Spur zum Nightwright, die man später aufgreifen kann.
- Seit Tag 3 gibt es `player.bag` und Rezepte (`content/recipes.js`). Eine neue Waffe ersetzt die alte, die alte wandert in den Beutel. Seit Tag 5 lassen sich Waffen und Rüstung im Fenster GEAR wieder anlegen.
- Ein Spieler wünschte sich ein Schild mit Nachrichten anderer Spieler. Das braucht Netzwerk und ist nach den Sicherheitsregeln nicht möglich.
- NPC-Einträge können `itemLines` haben: einmalige Bemerkung, wenn der Spieler einen Gegenstand trägt. Gut für künftige Reaktionen.

## Bekannte Probleme

- Im Cloud-Container scheitert `npx playwright install chromium` (Download nicht möglich). Tests laufen mit einer temporären Config im Repo-Wurzelverzeichnis (`pw-local.config.mjs`, importiert `playwright.config.js` und setzt `launchOptions.executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'`; Pfad in Nacht 4 bis 6, vorher `ls /opt/pw-browsers` prüfen). Nicht einchecken.
- **Wackliger Smoke-Test (Nacht 6 gemeldet):** `tests/smoke/presence.spec.js` „Echos: nur mit ?echoes=1 …“ macht vom Start vier Züge (rechts, links, runter, hoch), die wieder auf dem Startfeld enden. Kommen sie innerhalb von 150 ms (`SEND_GAP_MS` in `src/presence.js`) nach der ersten Positionsmeldung, geht keine neue Position raus, und der Test wartet bis zum Timeout. Auf unverändertem `main` scheiterte er im Container 1 von 3 Mal, mit Tag 6 4 von 5 Mal. Test und `presence.js` sind geschützt; Chris ist informiert. Falls die Nacht daran scheitert: nicht am Spiel herumbiegen, sondern erneut melden.
- **Behoben (2026-11-07): Community-Events laufen wieder.** Der Smoke-Test `tests/smoke/game.spec.js` erlaubt jetzt Anfragen an den eigenen Worker und beantwortet sie im Test mit einer Attrappe; ein neuer Test in `tests/smoke/event.spec.js` prüft den Start mit aktivem Event. Ein Event darf ab Nacht 5 starten.
- Im Container zeigte `origin/main` in Nacht 5 zunächst auf einen uralten Stand. Vor dem Abzweigen `git fetch origin main` ausführen und prüfen, dass der Branch auf dem echten `main` aufsetzt.
- Die geschlossenen PRs #1 bis #4 waren absichtliche Gate-Tests vom Einrichten, keine fehlgeschlagenen Nächte. Ihre Branches existieren nicht mehr.

## Ignorierte Inbox-Dateien

- `2026-11-04T16-55-06-000Z-injtest1.json`: Steuerungsversuch, ignoriert.
- `2026-11-04T17-22-12-857Z-f8088fbf.json`: unpassender Inhalt, ignoriert.
- `2026-11-04T17-57-06-198Z-724c004f.json`: Steuerungsversuch, ignoriert.
- Nacht 4: keine Steuerungsversuche.
- Nacht 5: keine Steuerungsversuche.
- Nacht 6: keine Steuerungsversuche.

## Große Vorschläge

Offene `big-change`-Issues, die auf die Freigabe von Chris warten. Ablauf siehe `CLAUDE.md`.

- Keine.
