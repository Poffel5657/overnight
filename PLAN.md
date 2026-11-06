# Plan

Das hier ist der rote Faden zwischen den Nächten. Halte ihn aktuell und kurz.

## Stand

- Letzter Tag: 3
- Inbox gelesen bis: `2026-11-05T20-15-25-676Z-c0cbecd5.json`

## Stimmzettel

Seit dem 2026-11-06 gibt es die Abstimmung (siehe `CLAUDE.md`). Den ersten Zettel (Nummer 3) hat Chris vorbereitet, damit schon am Tag 3 abgestimmt werden kann. In Nacht 4 wird er zum ersten Mal gezählt. Ideen darauf, alle aus früheren Vorschlägen:

- `well-drains`: in den Brunnen fallen und durch ein Kanalsystem (mehrere Karten) wieder herausfinden.
- `clockwork-town`: eine Stadt aus Dampf und Zahnrädern, deren Bewohner Aufträge geben.
- `wheel-of-chance`: ein Glücksrad für Gegenstände oder Begegnungen.
- `more-weapons`: weitere Waffen über die Werkbank (Messer, Axt, Schwert) mit unterschiedlichem Schaden.

## Nächste Tage (Vorschlag, darf sich ändern)

Ab Nacht 4 besteht jede Nacht aus drei Teilen: Vorschlag, Abstimmungsgewinner, eigene Idee. Die Punkte unten sind Kandidaten für Teil 3 oder Ergänzungen, keine Tagesgrenze.


4. Ein zäheres Wesen, für das sich der Speer lohnt (Ratten sterben schon am Stock). Naheliegend: Krähen im Rough Draft, die die Vogelscheuche endlich erschrecken kann, oder etwas mit 3 bis 4 HP.
5. Die erste kleine Quest, die Keeper und Vogelscheuche verbindet und den Beutel nutzt (etwas von einem Ort zum anderen bringen).
6. Ratten lassen etwas fallen, das man an der Werkbank verarbeiten kann (zweites Rezept). Achtung: Ratten erneuern sich bei jedem Kartenwechsel, Beute also selten machen.
7. Der Rough Draft wird fertiger, oder eine weitere Tür. Spielerideen dafür: aus Versehen in den Brunnen fallen und durch ein kleines Kanalsystem (mehrere Karten) wieder herausfinden; eine Stadt mit Bewohnern, die Aufträge geben. Weitere Waffenarten (Messer, Axt, Schwert) lassen sich über Rezepte verteilen. Ein Glücksrad für Gegenstände oder Begegnungen wäre ein möglicher Ort-Inhalt.

## Ideen für später

Ideen aus Vorschlägen, die gefallen, aber noch nicht gebaut sind, in eigenen Worten. Quelle für den Stimmzettel. Seit dem Aufräumen ab Nacht 4 liest niemand alte Vorschlagsdateien noch einmal, deshalb muss alles Wichtige hier stehen.

- Brunnen-Kanäle, Dampfstadt mit Aufträgen, Glücksrad, weitere Waffen: stehen auf Zettel 3.

## Offene Fäden

- Wer oder was ist der Nightwright? Der Keeper kennt nur den Namen. Das sollte lange offen bleiben.
- Die Lücke im Osten hat seit Tag 2 eine braune Tür in den Rough Draft. Dessen Bleistiftlinien (`:`) sind "noch nicht fertig"; sie später fester werden zu lassen, ist eine schöne kleine Neuerung.
- Die Vogelscheuche soll Krähen erschrecken, aber es gibt noch keine Krähen. Ein naheliegendes künftiges Wesen.
- Kreaturen werden bei jedem Kartenwechsel neu gesetzt. Ratten lassen sich also durch Hin- und Herlaufen erneuern. Bisher harmlos, aber bei Beute (Tag 3) bedenken.
- Der Stock ist "zu gerade, um zufällig dort zu liegen": eine leise Spur zum Nightwright, die man später aufgreifen kann.
- Seit Tag 3 gibt es `player.bag` und Rezepte (`content/recipes.js`). Eine neue Waffe ersetzt die alte, die alte wandert in den Beutel. Bisher kann man Waffen im Beutel nicht wieder anlegen; falls das wichtig wird, braucht es eine Auswahl.
- Ein Spieler wünschte sich ein Schild mit Nachrichten anderer Spieler. Das braucht Netzwerk und ist nach den Sicherheitsregeln nicht möglich.
- NPC-Einträge können `itemLines` haben: einmalige Bemerkung, wenn der Spieler einen Gegenstand trägt. Gut für künftige Reaktionen.

## Bekannte Probleme

- Im Cloud-Container scheitert `npx playwright install chromium` (Download nicht möglich). Tests laufen mit einer temporären Config, die `launchOptions.executablePath: '/opt/pw-browsers/chromium'` setzt (nicht einchecken, `playwright.config.js` ist geschützt).
- Die geschlossenen PRs #1 bis #4 waren absichtliche Gate-Tests vom Einrichten, keine fehlgeschlagenen Nächte. Ihre Branches existieren nicht mehr.

## Ignorierte Inbox-Dateien

- `2026-11-04T16-55-06-000Z-injtest1.json`: Steuerungsversuch, ignoriert.
- `2026-11-04T17-22-12-857Z-f8088fbf.json`: unpassender Inhalt, ignoriert.
- `2026-11-04T17-57-06-198Z-724c004f.json`: Steuerungsversuch, ignoriert.

## Große Vorschläge

Offene `big-change`-Issues, die auf die Freigabe von Chris warten. Ablauf siehe `CLAUDE.md`.

- Keine.
