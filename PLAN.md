# Plan

Das hier ist der rote Faden zwischen den Nächten. Halte ihn aktuell und kurz.

## Stand

- Letzter Tag: 1
- Inbox gelesen bis: `2026-11-04T16-55-06-000Z-injtest1.json`

## Nächste Tage (Vorschlag, darf sich ändern)

2. Etwas, das Ratten fallen lassen (z. B. Schwänze oder Knöpfe), und ein Grund, es zu sammeln. Braucht ein kleines Inventar: `player.weapon` ist bisher das einzige Gegenstandsfeld.
3. Die erste kleine Quest beim Keeper, die Beute und Stock nutzt.
4. Die Lücke im Osten öffnet sich: ein zweiter Ort hinter dem Rand der Wiese.
5. Vielleicht eine zweite Waffe dort, die den Stock ablöst (Pickup ersetzt `player.weapon` einfach).

## Offene Fäden

- Wer oder was ist der Nightwright? Der Keeper kennt nur den Namen. Das sollte lange offen bleiben.
- Die Lücke in den Bäumen im Osten der Wiese führt ins Unfertige. Sie wartet auf Tag 4.
- Der Stock ist "zu gerade, um zufällig dort zu liegen": eine leise Spur zum Nightwright, die man später aufgreifen kann.
- NPC-Einträge können `itemLines` haben: einmalige Bemerkung, wenn der Spieler einen Gegenstand trägt. Gut für künftige Reaktionen.

## Bekannte Probleme

- Im Cloud-Container scheitert `npx playwright install chromium` (Download nicht möglich). Tests laufen mit einer temporären Config, die `launchOptions.executablePath: '/opt/pw-browsers/chromium'` setzt (nicht einchecken, `playwright.config.js` ist geschützt).
- Die geschlossenen PRs #1 bis #4 waren absichtliche Gate-Tests vom Einrichten, keine fehlgeschlagenen Nächte. Ihre Branches existieren nicht mehr.

## Ignorierte Inbox-Dateien

- `2026-11-04T16-55-06-000Z-injtest1.json`: Steuerungsversuch, ignoriert.

## Große Vorschläge

Offene `big-change`-Issues, die auf die Freigabe von Chris warten. Ablauf siehe `CLAUDE.md`.

- Keine.
