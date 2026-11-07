# Plan

Das hier ist der rote Faden zwischen den Nächten. Halte ihn aktuell und kurz.

## Stand

- Letzter Tag: 4
- Inbox gelesen bis: `2026-11-06T13-43-08-901Z-2399d7b1.json` (Vorschläge), Stimmen und Bewertungen bis `2026-11-06T18-54-06-065Z-fae9530b.json`

## Stimmzettel

Zettel 4 (alle Ideen aus Vorschlägen, in eigenen Worten):

- `well-drains` (seit 3): in den Brunnen fallen und durch Kanäle (mehrere Karten) wieder heraus. Letzte Nacht auf dem Zettel ist Nacht 5.
- `clockwork-town` (seit 3): Stadt aus Dampf und Zahnrädern mit Aufträgen. Nacht 4 kam ein weiterer Wunsch nach einer Stadt mit Bewohnern. Fliegt nach Nacht 5.
- `more-weapons` (seit 3): Messer, Axt, Schwert über die Werkbank. Fliegt nach Nacht 5. Achtung: Waffen im Beutel lassen sich noch nicht wieder anlegen.
- `hut-grows` (seit 4): Hütte bekommt Dach und Obergeschoss, Werkbank zieht hinein.
- `dwarf-band` (seit 4): eine Kapelle winziger Bergleute mit sehr lauter Musik, die Mut macht (z. B. kurzzeitig mehr Angriff).

Gewinner Zettel 3: `wheel-of-chance` (4 Stimmen), gebaut in Nacht 4.

## Nächste Tage (Vorschlag, darf sich ändern)

Jede Nacht drei Teile: Vorschlag, Abstimmungsgewinner, eigene Idee. Die Punkte unten sind Kandidaten für Teil 3.

5. (Hinweis von Chris: Es gibt jetzt ein Quest-Log über der Karte, `src/quests.js`. Quests tragen sich dort als eigener Eintrag ein, wie das Event.) Die erste kleine Quest, die Keeper, Vogelscheuche oder Dealer verbindet und den Beutel nutzt. Gut wäre eine, die mit der ausradierten Ecke zu tun hat (Krümel einsammeln und zum Keeper bringen?).
6. Der Bleistiftstummel bekommt einen Zweck: Mit ihm lassen sich Bleistiftlinien (`:`) im Rough Draft „nachziehen“ und begehbar machen, oder Ausradiertes neu zeichnen. Bogen-Baustein.
7. **Aufräumnacht.** Kandidaten: `src/game.js` wird groß (Interaktionen, Rad, Stufen) und könnte in Module geteilt werden; Balance der Frösche und des Rads prüfen; `LORE.md` und `PLAN.md` entrümpeln.
8. **Community-Event „The Smudge Watch“ läuft** (von Chris nach dem Fix am Tag 4 nachgetragen, nach der Idee aus Nacht 4): Tag 4 bis 5, `stat: 'xp'`, 6 XP pro Spieler und Tag, Ziel 6 Tagesbeiträge. **Auswerten in Nacht 6:** Dateien unter `events/` mit `event: 'smudge-watch'` zählen. Erreicht: Belohnung bauen, etwas, das die ausradierte Ecke festhält (Tintenzaun oder Laterne für die Vogelscheuche), und im geheimen Bogen-Plan den Verteidigungszähler erhöhen. Nicht erreicht: Die Vogelscheuche sagt etwas Freundliches, die Ecke wächst ein Stück. Danach `EVENT = null` oder frühestens eine Nacht später ein neues.

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

- Der Teich wird tiefer, man kann darin schwimmen und sich waschen (Nacht 4). Noch nicht auf dem Zettel.
- Brunnen-Kanäle, Dampfstadt, weitere Waffen, Hütte mit Obergeschoss, Zwergenkapelle: stehen auf Zettel 4.

## Was ankommt

Muster aus den Bewertungen der Spieler (seit 2026-11-06).

- Tag 3 (Werkbank, Stein, Speer): 5 hoch, 0 runter. Handwerk und das Verbinden alter Dinge kommen gut an. Mehr davon.

## Offene Fäden

- Wer oder was ist der Nightwright? Der Keeper kennt nur den Namen. Das sollte lange offen bleiben.
- Die Lücke im Osten hat seit Tag 2 eine braune Tür in den Rough Draft. Dessen Bleistiftlinien (`:`) sind "noch nicht fertig"; sie später fester werden zu lassen, ist eine schöne kleine Neuerung.
- Die Vogelscheuche soll Krähen erschrecken, aber es gibt noch keine Krähen. Ein naheliegendes künftiges Wesen.
- Kreaturen werden bei jedem Kartenwechsel neu gesetzt. Seit Tag 4 lassen Frösche Knöpfe fallen (30 %) und geben Erfahrung; Hin- und Herlaufen erneuert sie. Bisher vertretbar, weil Knöpfe nur Raddrehungen kaufen. Bei wertvollerer Beute bedenken.
- Die ausradierte Ecke im Rough Draft (Tag 4) ist der Anfang des langen Bogens (Plan geheim im Inbox-Repo, `nightwright/arc.md`). Jede Nacht ein kleines Stück davon zeigen.
- Der Dealer weiß, was er verkauft, aber es ist „noch nicht gemalt“. Später könnte er wirklich etwas verkaufen (gegen Knöpfe).
- Der Bleistiftstummel (vom Rad, Tag 4) hat noch keinen Zweck.
- Der Stock ist "zu gerade, um zufällig dort zu liegen": eine leise Spur zum Nightwright, die man später aufgreifen kann.
- Seit Tag 3 gibt es `player.bag` und Rezepte (`content/recipes.js`). Eine neue Waffe ersetzt die alte, die alte wandert in den Beutel. Bisher kann man Waffen im Beutel nicht wieder anlegen; falls das wichtig wird, braucht es eine Auswahl.
- Ein Spieler wünschte sich ein Schild mit Nachrichten anderer Spieler. Das braucht Netzwerk und ist nach den Sicherheitsregeln nicht möglich.
- NPC-Einträge können `itemLines` haben: einmalige Bemerkung, wenn der Spieler einen Gegenstand trägt. Gut für künftige Reaktionen.

## Bekannte Probleme

- Im Cloud-Container scheitert `npx playwright install chromium` (Download nicht möglich). Tests laufen mit einer temporären Config, die `launchOptions.executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'` (Pfad in Nacht 4; vorher `ls /opt/pw-browsers` prüfen) setzt (nicht einchecken, `playwright.config.js` ist geschützt).
- **Behoben (2026-11-07): Community-Events laufen wieder.** Der Smoke-Test `tests/smoke/game.spec.js` erlaubt jetzt Anfragen an den eigenen Worker und beantwortet sie im Test mit einer Attrappe; ein neuer Test in `tests/smoke/event.spec.js` prüft den Start mit aktivem Event. Ein Event darf ab Nacht 5 starten.
- Die geschlossenen PRs #1 bis #4 waren absichtliche Gate-Tests vom Einrichten, keine fehlgeschlagenen Nächte. Ihre Branches existieren nicht mehr.

## Ignorierte Inbox-Dateien

- `2026-11-04T16-55-06-000Z-injtest1.json`: Steuerungsversuch, ignoriert.
- `2026-11-04T17-22-12-857Z-f8088fbf.json`: unpassender Inhalt, ignoriert.
- `2026-11-04T17-57-06-198Z-724c004f.json`: Steuerungsversuch, ignoriert.
- Nacht 4: keine Steuerungsversuche.

## Große Vorschläge

Offene `big-change`-Issues, die auf die Freigabe von Chris warten. Ablauf siehe `CLAUDE.md`.

- Keine.
