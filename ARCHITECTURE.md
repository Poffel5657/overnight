# Aufbau

Statische Seite ohne Build-Schritt und ohne Laufzeit-Abhängigkeiten, Vanilla JS mit ES-Modulen. Alle Pfade sind relativ, weil das Spiel unter `/overnight/` und als Archiv unter `/overnight/day/NNN/` läuft.

## Dateien

| Pfad | Inhalt |
|---|---|
| `index.html`, `style.css` | Seite und Oberfläche im Terminal-Look (siehe „Oberfläche“), inklusive Content-Security-Policy |
| `src/terminal.js` | Bootsequenz, Countdown, CRT-Schalter |
| `fonts/` | Selbst gehostete Schrift VT323 |
| `src/game.js` | Reine Spiellogik ohne DOM, `act(state, action)` ist der einzige Einstieg für Züge |
| `src/render.js` | Zeichnet die Welt aufs Canvas (25 x 13 Felder, auf dem Handy 15 x 11, die Kamera folgt, wenn die Karte größer ist als der Ausschnitt) |
| `src/save.js` | Spielstand, Versionen, Migrationen |
| `src/main.js` | Verbindet alles, Eingabe, Chronik-Dialog, Begrüßung, `window.__overnight` |
| `src/suggest.js`, `src/config.js` | Vorschlagsformular, gemeinsames Captcha (`createCaptcha`) und Einstellungen (geschützt) |
| `src/vote.js` | Abstimmungsdialog über `content/ballot.js`, schickt `{ ballot, choice }` an `/vote` des Workers (geschützt) |
| `src/rate.js` | Daumen hoch/runter für die letzte Nacht (`#rate-box`), schickt `{ day, value }` an `/rate`, einmal pro Nacht (geschützt) |
| `src/event.js` | Community-Event: Anzeige `#event-box`, Tagesfortschritt in `localStorage` (`overnight.event`), meldet den Tagesbeitrag an `/event` des Workers, liest den Zähler per `GET /event?id=` (geschützt) |
| `content/event.js` | `EVENT` (oder `null`): `{ id, title, text, task, reward, stat, need, goal, startDay, endDay }`, Format prüft `tests/smoke/event.spec.js` |
| `timelapse/` | Zeitraffer-Seite; `days.js` und `shots/` erzeugt der Deploy mit `.github/scripts/timelapse.mjs` (geschützt) |
| `LORE.md` | Weltlexikon: Orte, Figuren, Dinge, offene Fäden, Zeitleiste |
| `content/ballot.js` | Stimmzettel `BALLOT = { day, options: [{ id, since, text }] }`, jede Nacht neu datiert (Format prüft `tests/smoke/vote.spec.js`) |
| `content/tiles.js` | Geländetypen |
| `content/creatures.js` | Kreaturentypen |
| `content/items.js` | Gegenstände: mit `atk` (und `hitVerb`) eine Waffe, ohne `atk` ein Ding für den Beutel |
| `content/recipes.js` | Rezepte für die Werkbank: `needs`, `makes`, `text`, `hint` |
| `content/world.js` | Karten, Objekte, Spawns, Spielerwerte, Startpunkt |
| `content/chronicle.js` | Chronik im Spiel, der letzte Eintrag legt die Tageszahl fest |
| `tests/smoke/` | Allgemeine Tests, die immer gelten (geschützt) |
| `tests/day/` | Tests pro Neuerung |
| `tests/fixtures/` | Alte Spielstände, die immer ladbar bleiben müssen |
| `worker/` | Cloudflare Worker: `POST /` legt Vorschläge unter `suggestions/` ab, `POST /vote` Stimmen unter `votes/`, `POST /rate` Bewertungen unter `ratings/`, `POST /event` Event-Beiträge unter `events/` im Inbox-Repo (ohne Captcha, Zähler in KV für die Anzeige); je ein Vorschlag und eine Stimme pro Nacht und Anschluss (geschützt) |

## Oberfläche

`index.html` ist gegliedert in `.statusbar` (Titel, `#day-label`, Menüs TONIGHT, SHAPE TOMORROW, ARCHIVE, Countdown, CRT-Schalter), einen optionalen Event-Streifen `#event-box` und `.play` (Karte `#world`, HUD mit Bewertung, Log, Steuerkreuz). Die Seite ist genau einen Bildschirm hoch und scrollt nicht; die Karte füllt den freien Platz, so groß es geht, ohne Verzerrung (`.map-frame` mit Container-Einheiten, `--map-ratio` setzt `src/render.js`). Tests dazu in `tests/smoke/ui.spec.js`.

- **Neuer Menüpunkt:** `<div class="menu">` mit `<button class="menu-button" aria-controls="panel-x">` und `<section id="panel-x" class="menu-panel window" hidden>` in `.menus`; die Logik in `setupMenus()` (`src/main.js`) greift von selbst. Im Panel erst ein Satz, was das ist, dann die Punkte als `<dl class="menu-list">` mit Knopf und Erklärung.
- **Handy:** Das Steuerkreuz `.pad` liegt halbdurchsichtig unten rechts über der Karte (im Kartenfenster), das Log lässt sich einklappen (`#log-toggle`, gespeichert als `overnight.log`), dann zeigt `#log-peek` die neueste Zeile in der Titelleiste. `src/render.js` zeigt auf schmalen Bildschirmen 12 Spalten und so viele Zeilen, wie in den Rahmen passen, und passt das bei Größenänderungen an (ResizeObserver).
- **Icon:** `icon.svg` (Pixel-Mondsichel im CRT-Look) und `icon-180.png` für Homescreens.
- **Neue Anzeige zum Spielstand** gehört in `drawHud()` in `src/main.js` (Zeile unter der Karte). Nichts dauerhaft zwischen Karte und Log stellen, was viel Höhe braucht: Die Karte bekommt nur, was übrig bleibt.
- **Farben** nur über die Tokens in `:root` von `style.css` (`--text`, `--accent`, `--muted`, `--bright`, `--good`, `--danger`, `--line`, `--panel`). Keine festen Höhen im Spielbereich, sonst rutscht am Handy das Steuerkreuz aus dem Bild.
- **Knöpfe** bekommen die eckigen Klammern per CSS; im HTML steht nur der Text. Links, die wie Knöpfe aussehen sollen, haben `class="button"`.
- **`src/terminal.js`:** Bootsequenz (einmal pro Tag, blockiert keine Eingabe), Countdown bis Mitternacht in Berlin, CRT-Schalter (`overnight.crt` in `localStorage`). `src/render.js` lässt die Zeichen leicht leuchten, wenn CRT an ist.
- **Schrift:** `fonts/vt323.woff2` (OFL, Lizenz in `fonts/OFL.txt`), nur für die Oberfläche; die Karte nutzt eine Systemschrift, weil VT323 Zeichen wie `♣` und `π` fehlen.

## Systeme

- **Züge:** `act()` nimmt `up`, `down`, `left`, `right` oder `wait`. Reihenfolge beim Laufen: Kreatur angreifen, sonst Objekt benutzen, sonst laufen. Gegen nicht begehbares Gelände zu laufen kostet keine Runde.
- **Objekte:** Einträge in `entities` einer Karte. `kind` wählt das Verhalten aus `INTERACTIONS` in `src/game.js`. Bisher: `npc`, `sign`, `well`, `pickup`, `door`. `door` hat `to: { map, x, y }` und wechselt über `enterMap()` die Karte; das Ankunftsfeld muss begehbar und frei sein (Test in `tests/day/002-door.spec.js`). `pickup` mit `item` gibt den Gegenstand über `giveItem()` (Waffe nach `player.weapon`, die alte Waffe in den Beutel; sonst nach `player.bag`) und setzt `flags.taken[id]`; `bench` baut das erste Rezept, für das `hasItem()` alles findet, verbraucht die Zutaten und gibt das Ergebnis; `visibleEntities(s)` blendet aufgenommene Objekte aus (Logik und Zeichnen nutzen es). `npc` kann `itemLines` haben: eine einmalige Bemerkung, sobald der Spieler den Gegenstand trägt (gemerkt in `flags.heard`).
- **Gelände:** Objekte müssen auf begehbaren Feldern stehen (Smoke-Test). Für Dinge "im Wasser" gibt es deshalb die begehbare flache Stelle `s` (seit Tag 3).
- **Angriff:** Immer `attackOf(s)` verwenden, das ist `player.atk` plus Bonus der Waffe.
- **Kreaturen:** `ai` wählt das Verhalten aus `AI_BEHAVIOURS` in `src/game.js`. Bisher: `skulk`. Besiegte Kreaturen kommen nach `respawnTurns` zurück, wenn der Spieler weit genug weg ist.
- **Zufall:** Immer `random(s)` aus `src/game.js` verwenden, nie `Math.random()`, sonst sind Tests nicht wiederholbar.
- **Karten:** `content/world.js` hat bisher `meadow` (Start) und `draft` (Rough Draft, seit Tag 2). Jeder Kartenwechsel läuft über `enterMap()` in `src/game.js`, das die Kreaturen der Zielkarte frisch setzt. Die Anzeige oben zeigt den `name` der Karte.
- **Niederlage:** Spieler wacht am `START` mit vollen HP auf, die Kreaturen werden neu gesetzt (auch aus anderen Karten zurück auf die Wiese).

## Spielstand

`localStorage` unter `overnight.save`, Archivversionen unter `overnight.save.dayNNN`. Gespeichert werden `version`, `map`, `player`, `turn`, `flags`, `stats`, `lastSeenDay`. Kreaturen werden absichtlich nicht gespeichert. Steht der Spieler nach einem Update auf einem nicht begehbaren Feld, kommt er zurück zum Start.

Aktuelle `SAVE_VERSION`: 1. Seit Tag 1 gibt es das optionale Feld `player.weapon` (fehlt es, gilt `null`) und die Flags `taken` und `heard`. Das ist abwärtskompatibel, daher keine neue Version; Fixture `save-v1-day1-stick.json`. Seit Tag 2 kann `map` auch `draft` sein, ebenfalls ohne neue Version; Fixture `save-v1-day2-draft.json`. Seit Tag 3 gibt es das optionale Feld `player.bag` (Liste von Gegenstands-IDs; fehlt es, gilt `[]`, unbekannte IDs werden beim Laden verworfen), ohne neue Version; Fixture `save-v1-day3-bag.json`.

## Testschnittstelle

`window.__overnight` bietet `state`, `day` und `act(action)`. Die Smoke-Tests hängen davon ab, sie darf nur erweitert werden.

## Veröffentlichung

Der Deploy nimmt außerdem für jede archivierte Nacht ein Bild auf (frischer Browser, `?seed=1`, nur das Canvas) und schreibt `timelapse/days.js`. Scheitert das, geht die Seite trotzdem raus.

Ein PR von `claude/day-NNN` wird von `.github/workflows/nightly-gate.yml` geprüft und gemergt, danach taggt der Workflow `day-NNN` und startet den Deploy. `.github/workflows/deploy.yml` baut die Seite aus `main` und legt für jeden Tag eine spielbare Kopie unter `day/NNN/` an. Fehlschläge lassen die Live-Seite unverändert.

Grenzen pro PR: 1000 geänderte Zeilen außerhalb von `content/`, `tests/` und Doku. Bis 3000 nur mit `Big-Change: #N` in der PR-Beschreibung und einem `ja`-Kommentar von Chris auf dem `big-change`-Issue. Der Workflow schließt das Issue nach dem Merge.
