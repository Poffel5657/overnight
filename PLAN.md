# Plan

Das hier ist der rote Faden zwischen den Nächten. Halte ihn aktuell und kurz.

## Stand

- Letzter Tag: 5
- Inbox gelesen bis: `2026-11-07T14-13-55-240Z-d47689fd.json` (Vorschläge), Stimmen bis `2026-11-07T16-28-50-714Z-7d690669.json`, Bewertungen bis `2026-11-07T18-38-21-259Z-660b9729.json`
- Event-Beiträge `smudge-watch` bis `2026-11-07T19-58-26-678Z-3c72fe11.json` gesehen (7 Stück), aber liegen gelassen, weil das Event heute noch läuft.

## Stimmzettel

Zettel 5 (alle Ideen aus Vorschlägen, in eigenen Worten):

- `clockwork-town` (seit 3): Stadt aus Dampf und Zahnrädern mit Aufträgen. Letzte Nacht auf dem Zettel ist Nacht 5, fliegt danach heraus (zurück unter „Ideen für später“).
- `more-weapons` (seit 3): Messer, Axt, Schwert über die Werkbank. Fliegt nach Nacht 5. Seit Tag 5 lassen sich Waffen im Beutel über GEAR wieder anlegen, das Hindernis ist weg.
- `hut-grows` (seit 4): Hütte bekommt Dach und Obergeschoss, Werkbank zieht hinein.
- `dwarf-band` (seit 4): Kapelle winziger Bergleute mit lauter Musik, die Mut macht.
- `deep-pond` (seit 5): der Teich wird tiefer, man kann schwimmen (Vorschlag aus Nacht 4).

Gewinner Zettel 4: `well-drains` (4 Stimmen, Dampfstadt 1, Rest 0), gebaut in Nacht 5.

## Nächste Tage (Vorschlag, darf sich ändern)

Jede Nacht drei Teile: Vorschlag, Abstimmungsgewinner, eigene Idee. Die Punkte unten sind Kandidaten für Teil 3.

6. **Event „The Smudge Watch“ auswerten:** Dateien unter `events/` mit `event: 'smudge-watch'` zählen (Stand Nacht 5: schon 7 von 6). Erreicht: Belohnung bauen, etwas, das die ausradierte Ecke festhält (Tintenzaun oder Laterne für die Vogelscheuche), als Teil 3; die Vogelscheuche bedankt sich. Danach `EVENT = null` (frühestens Nacht 7 ein neues). Außerdem Kandidat: Der Bleistiftstummel bekommt einen Zweck (Bleistiftlinien `:` im Rough Draft nachziehen und begehbar machen).
7. **Aufräumnacht.** Kandidaten: `src/game.js` ist auf etwa 560 Zeilen gewachsen und sollte in Module (Gegenstände/Rüstung, Quests, Kreaturen-Verhalten) geteilt werden; Balance prüfen (Krümelhaufen 30 HP/5 Angriff, Aale, Knopfpanzer gegen Radkosten); `LORE.md` und `PLAN.md` entrümpeln.
8. Der Dealer verkauft endlich etwas gegen Knöpfe (offener Faden und Wunsch nach einem großen Sortiment). Oder eine zweite Quest bei der Vogelscheuche oder dem Dealer, die die Kanäle nutzt.

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

- Tägliche Aufgaben mit guten Belohnungen (Nacht 5). Passt zum neuen Quest-System, bräuchte ein Datum pro Quest.
- Fähigkeiten, die man lernt: Kräuterkunde, Bergbau, Kampf, Schmieden; damit Rohstoffe für die Werkbank sammeln (Nacht 5, zwei Spieler). Großes System, eher schrittweise: erst ein Rohstoff, den man abbauen kann.
- Eine seltsame Steinformation im Rough Draft, von der niemand weiß, was sie kann (Nacht 5).
- Der Dealer bekommt ein großes Sortiment (Nacht 5). Passt zum offenen Faden, dass er „noch nicht gemalte“ Ware hat.
- Dampfstadt und weitere Waffen fliegen nach Nacht 5 vom Zettel; dann hierher zurück, falls sie nicht gewinnen.
- Teich, Hütte, Zwergenkapelle: stehen auf Zettel 5.

## Was ankommt

Muster aus den Bewertungen der Spieler (seit 2026-11-06).

- Tag 3 (Werkbank, Stein, Speer): 5 hoch, 0 runter. Handwerk und das Verbinden alter Dinge kommen gut an. Mehr davon.
- Tag 4 (Stufen, Rad, Ecke, Frösche): 4 hoch, 0 runter. Systeme, die Fortschritt zeigen, kommen an. Spieler wünschen sich jetzt deutlich mehr Tiefe (Ausrüstung, Fähigkeiten, Bosse).

## Offene Fäden

- Wer oder was ist der Nightwright? Der Keeper kennt nur den Namen. Das sollte lange offen bleiben.
- Die Lücke im Osten hat seit Tag 2 eine braune Tür in den Rough Draft. Dessen Bleistiftlinien (`:`) sind "noch nicht fertig"; sie später fester werden zu lassen, ist eine schöne kleine Neuerung.
- Seit Tag 5 gibt es Quests (`content/quests.js`) und das Quest-Log zeigt sie. Weitere Quests sind billig: nur Daten. Die Quest-Art ist bisher „bring n Stück von X“.
- Nasse Fußspuren in den Kanälen, „not yours“ (Tag 5), und ein Bleistiftzettel in der Sumpftruhe. Leise weiterspinnen.
- Der Krümelhaufen ist besiegt-einmalig. Falls mehr Krümel nachkommen (Bogen), könnte sich ein neuer Haufen bilden.
- Die Vogelscheuche soll Krähen erschrecken, aber es gibt noch keine Krähen. Ein naheliegendes künftiges Wesen.
- Kreaturen werden bei jedem Kartenwechsel neu gesetzt. Seit Tag 4 lassen Frösche Knöpfe fallen (30 %) und geben Erfahrung; Hin- und Herlaufen erneuert sie. Bisher vertretbar, weil Knöpfe nur Raddrehungen kaufen. Bei wertvollerer Beute bedenken.
- Die ausradierte Ecke im Rough Draft (Tag 4) ist der Anfang des langen Bogens (Plan geheim im Inbox-Repo, `nightwright/arc.md`). Jede Nacht ein kleines Stück davon zeigen.
- Der Dealer weiß, was er verkauft, aber es ist „noch nicht gemalt“. Später könnte er wirklich etwas verkaufen (gegen Knöpfe).
- Der Bleistiftstummel (vom Rad, Tag 4) hat noch keinen Zweck.
- Kreaturen werden beim Kartenwechsel neu gesetzt, auch der Krümelhaufen mit vollen HP. Wer flieht, fängt neu an. Gewollt, aber im Blick behalten.
- Der Stock ist "zu gerade, um zufällig dort zu liegen": eine leise Spur zum Nightwright, die man später aufgreifen kann.
- Seit Tag 3 gibt es `player.bag` und Rezepte (`content/recipes.js`). Eine neue Waffe ersetzt die alte, die alte wandert in den Beutel. Seit Tag 5 lassen sich Waffen und Rüstung im Fenster GEAR wieder anlegen.
- Ein Spieler wünschte sich ein Schild mit Nachrichten anderer Spieler. Das braucht Netzwerk und ist nach den Sicherheitsregeln nicht möglich.
- NPC-Einträge können `itemLines` haben: einmalige Bemerkung, wenn der Spieler einen Gegenstand trägt. Gut für künftige Reaktionen.

## Bekannte Probleme

- Im Cloud-Container scheitert `npx playwright install chromium` (Download nicht möglich). Tests laufen mit einer temporären Config, die `launchOptions.executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'` (Pfad in Nacht 4 und 5; vorher `ls /opt/pw-browsers` prüfen) setzt (nicht einchecken, `playwright.config.js` ist geschützt).
- **Behoben (2026-11-07): Community-Events laufen wieder.** Der Smoke-Test `tests/smoke/game.spec.js` erlaubt jetzt Anfragen an den eigenen Worker und beantwortet sie im Test mit einer Attrappe; ein neuer Test in `tests/smoke/event.spec.js` prüft den Start mit aktivem Event. Ein Event darf ab Nacht 5 starten.
- Im Container zeigte `origin/main` in Nacht 5 zunächst auf einen uralten Stand. Vor dem Abzweigen `git fetch origin main` ausführen und prüfen, dass der Branch auf dem echten `main` aufsetzt.
- Die geschlossenen PRs #1 bis #4 waren absichtliche Gate-Tests vom Einrichten, keine fehlgeschlagenen Nächte. Ihre Branches existieren nicht mehr.

## Ignorierte Inbox-Dateien

- `2026-11-04T16-55-06-000Z-injtest1.json`: Steuerungsversuch, ignoriert.
- `2026-11-04T17-22-12-857Z-f8088fbf.json`: unpassender Inhalt, ignoriert.
- `2026-11-04T17-57-06-198Z-724c004f.json`: Steuerungsversuch, ignoriert.
- Nacht 4: keine Steuerungsversuche.
- Nacht 5: keine Steuerungsversuche.

## Große Vorschläge

Offene `big-change`-Issues, die auf die Freigabe von Chris warten. Ablauf siehe `CLAUDE.md`.

- Keine.
