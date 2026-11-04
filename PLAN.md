# Plan

Das hier ist der rote Faden zwischen den Nächten. Halte ihn aktuell und kurz.

## Stand

- Letzter Tag: 2
- Inbox gelesen bis: `2026-11-04T22-50-33-375Z-f4f78185.json`

## Nächste Tage (Vorschlag, darf sich ändern)

3. Etwas, das Ratten fallen lassen (z. B. Schwänze oder Knöpfe), und ein Grund, es zu sammeln. Braucht ein kleines Inventar: `player.weapon` ist bisher das einzige Gegenstandsfeld.
4. Die erste kleine Quest, die Beute nutzt. Gut wäre eine, die Keeper und Vogelscheuche verbindet (zum Beispiel etwas von der Wiese in den Rough Draft bringen).
5. Eine zweite Waffe im Rough Draft, die den Stock ablöst (Pickup ersetzt `player.weapon` einfach). Ein Spieler wünscht sich mehrere Waffenarten mit unterschiedlichem Schaden (Messer, Speer, Axt, Schwert); das kann man über mehrere Tage verteilen.
6. Der Rough Draft wird fertiger: Bleistiftlinien werden zu echtem Gelände, oder eine weitere Tür führt weiter.

## Offene Fäden

- Wer oder was ist der Nightwright? Der Keeper kennt nur den Namen. Das sollte lange offen bleiben.
- Die Lücke im Osten hat seit Tag 2 eine braune Tür in den Rough Draft. Dessen Bleistiftlinien (`:`) sind "noch nicht fertig"; sie später fester werden zu lassen, ist eine schöne kleine Neuerung.
- Die Vogelscheuche soll Krähen erschrecken, aber es gibt noch keine Krähen. Ein naheliegendes künftiges Wesen.
- Kreaturen werden bei jedem Kartenwechsel neu gesetzt. Ratten lassen sich also durch Hin- und Herlaufen erneuern. Bisher harmlos, aber bei Beute (Tag 3) bedenken.
- Der Stock ist "zu gerade, um zufällig dort zu liegen": eine leise Spur zum Nightwright, die man später aufgreifen kann.
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
