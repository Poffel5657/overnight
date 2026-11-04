# Aufbau

Statische Seite ohne Build-Schritt und ohne Laufzeit-Abhängigkeiten, Vanilla JS mit ES-Modulen. Alle Pfade sind relativ, weil das Spiel unter `/overnight/` und als Archiv unter `/overnight/day/NNN/` läuft.

## Dateien

| Pfad | Inhalt |
|---|---|
| `index.html`, `style.css` | Seite und Oberfläche, inklusive Content-Security-Policy |
| `src/game.js` | Reine Spiellogik ohne DOM, `act(state, action)` ist der einzige Einstieg für Züge |
| `src/render.js` | Zeichnet die Welt aufs Canvas (25 x 13 Felder, auf dem Handy 15 x 11, die Kamera folgt, wenn die Karte größer ist als der Ausschnitt) |
| `src/save.js` | Spielstand, Versionen, Migrationen |
| `src/main.js` | Verbindet alles, Eingabe, Chronik-Dialog, Begrüßung, `window.__overnight` |
| `src/suggest.js`, `src/config.js` | Vorschlagsformular und Einstellungen (geschützt) |
| `content/tiles.js` | Geländetypen |
| `content/creatures.js` | Kreaturentypen |
| `content/items.js` | Gegenstände (bisher nur Waffen mit `atk`-Bonus und `hitVerb`) |
| `content/world.js` | Karten, Objekte, Spawns, Spielerwerte, Startpunkt |
| `content/chronicle.js` | Chronik im Spiel, der letzte Eintrag legt die Tageszahl fest |
| `tests/smoke/` | Allgemeine Tests, die immer gelten (geschützt) |
| `tests/day/` | Tests pro Neuerung |
| `tests/fixtures/` | Alte Spielstände, die immer ladbar bleiben müssen |
| `worker/` | Cloudflare Worker für Vorschläge (geschützt) |

## Systeme

- **Züge:** `act()` nimmt `up`, `down`, `left`, `right` oder `wait`. Reihenfolge beim Laufen: Kreatur angreifen, sonst Objekt benutzen, sonst laufen. Gegen nicht begehbares Gelände zu laufen kostet keine Runde.
- **Objekte:** Einträge in `entities` einer Karte. `kind` wählt das Verhalten aus `INTERACTIONS` in `src/game.js`. Bisher: `npc`, `sign`, `well`, `pickup`, `door`. `door` hat `to: { map, x, y }` und wechselt über `enterMap()` die Karte; das Ankunftsfeld muss begehbar und frei sein (Test in `tests/day/002-door.spec.js`). `pickup` mit `item` legt den Gegenstand als `player.weapon` an und setzt `flags.taken[id]`; `visibleEntities(s)` blendet aufgenommene Objekte aus (Logik und Zeichnen nutzen es). `npc` kann `itemLines` haben: eine einmalige Bemerkung, sobald der Spieler den Gegenstand trägt (gemerkt in `flags.heard`).
- **Angriff:** Immer `attackOf(s)` verwenden, das ist `player.atk` plus Bonus der Waffe.
- **Kreaturen:** `ai` wählt das Verhalten aus `AI_BEHAVIOURS` in `src/game.js`. Bisher: `skulk`. Besiegte Kreaturen kommen nach `respawnTurns` zurück, wenn der Spieler weit genug weg ist.
- **Zufall:** Immer `random(s)` aus `src/game.js` verwenden, nie `Math.random()`, sonst sind Tests nicht wiederholbar.
- **Karten:** `content/world.js` hat bisher `meadow` (Start) und `draft` (Rough Draft, seit Tag 2). Jeder Kartenwechsel läuft über `enterMap()` in `src/game.js`, das die Kreaturen der Zielkarte frisch setzt. Die Anzeige oben zeigt den `name` der Karte.
- **Niederlage:** Spieler wacht am `START` mit vollen HP auf, die Kreaturen werden neu gesetzt (auch aus anderen Karten zurück auf die Wiese).

## Spielstand

`localStorage` unter `overnight.save`, Archivversionen unter `overnight.save.dayNNN`. Gespeichert werden `version`, `map`, `player`, `turn`, `flags`, `stats`, `lastSeenDay`. Kreaturen werden absichtlich nicht gespeichert. Steht der Spieler nach einem Update auf einem nicht begehbaren Feld, kommt er zurück zum Start.

Aktuelle `SAVE_VERSION`: 1. Seit Tag 1 gibt es das optionale Feld `player.weapon` (fehlt es, gilt `null`) und die Flags `taken` und `heard`. Das ist abwärtskompatibel, daher keine neue Version; Fixture `save-v1-day1-stick.json`. Seit Tag 2 kann `map` auch `draft` sein, ebenfalls ohne neue Version; Fixture `save-v1-day2-draft.json`.

## Testschnittstelle

`window.__overnight` bietet `state`, `day` und `act(action)`. Die Smoke-Tests hängen davon ab, sie darf nur erweitert werden.

## Veröffentlichung

Ein PR von `claude/day-NNN` wird von `.github/workflows/nightly-gate.yml` geprüft und gemergt, danach taggt der Workflow `day-NNN` und startet den Deploy. `.github/workflows/deploy.yml` baut die Seite aus `main` und legt für jeden Tag eine spielbare Kopie unter `day/NNN/` an. Fehlschläge lassen die Live-Seite unverändert.

Grenzen pro PR: 1000 geänderte Zeilen außerhalb von `content/`, `tests/` und Doku. Bis 3000 nur mit `Big-Change: #N` in der PR-Beschreibung und einem `ja`-Kommentar von Chris auf dem `big-change`-Issue. Der Workflow schließt das Issue nach dem Merge.
