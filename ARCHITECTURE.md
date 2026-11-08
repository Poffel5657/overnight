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
| `src/quests.js` | Quest-Log `#quest-log`: Tracker oben rechts über der Karte, einklappbar (`localStorage` `overnight.quest-log`). Einträge sind `<li class="quest">` in `#quest-list`, kompakt (Titel, Fortschritt), Beschreibung `.quest-text` und Kleingedrucktes `.quest-fine` nach Klick. Wer Einträge ein- oder ausblendet, ruft `refreshQuestLog()` auf. Quests aus `content/quests.js` trägt `updateQuests()` ein (`li.quest.quest-entry[data-quest]`, Titel, Fortschritt `.quest-progress`, Aufgabe), aufgerufen in `refresh()` |
| `src/event.js` | Community-Event: Eintrag `#event-box` im Quest-Log (pulsiert, bis man die Figur kennt), einmaliger Hinweis `#event-toast` mitten auf der Karte beim Laden (`localStorage` `overnight.event-toast`), Tagesfortschritt in `localStorage` (`overnight.event`), meldet den Tagesbeitrag an `/event` des Workers, liest den Zähler per `GET /event?id=` (geschützt) |
| `src/presence.js` | Echos (andere Spieler): WebSocket an `/presence` des Workers, schickt nur `{ t: 'pos', map, x, y }` (gedrosselt) und `{ t: 'emote', e }`, empfängt `hello`/`pos`/`gone`/`emote` mit anonymen Tagesnamen. Aktiv ab `PRESENCE.fromDay` oder mit `?echoes=1`, nie im Archiv; trennt nach 60 s im Hintergrund (geschützt) |
| `content/presence.js` | `PRESENCE = { fromDay, color, emotes: [{ id, key, button, bubble, verb }] }`. Gesten-IDs muss der Worker kennen (`wave`, `cheer`, `bow`, `help` in `worker/presence.js`); neue IDs braucht Chris im Worker |
| `content/event.js` | `EVENT` (oder `null`): `{ id, title, text, task, reward, stat, need, goal, startDay, endDay }`, Format prüft `tests/smoke/event.spec.js` |
| `about/` | Seite „About Overnight“ für neue Besucher: was das Experiment ist, wie eine Nacht läuft, wie man mitmacht; zeigt die letzten Nächte aus `content/chronicle.js` (geschützt) |
| `og.png`, `.github/scripts/og-card.mjs` | Vorschaubild für geteilte Links (1200 x 630). Der Deploy baut es jede Nacht aus dem neuesten Kartenbild und setzt `og:title` auf die Nacht; `og.png` im Repo ist der Ersatz |
| `timelapse/` | Zeitraffer-Seite: pro Nacht eine Weltkarte aller Gebiete, über Türen nebeneinandergelegt (`atlas.js`), Änderungen zur Vornacht markiert; `days.js` erzeugt der Deploy mit `.github/scripts/timelapse-days.mjs` (geschützt) |
| `LORE.md` | Weltlexikon: Orte, Figuren, Dinge, offene Fäden, Zeitleiste |
| `content/ballot.js` | Stimmzettel `BALLOT = { day, options: [{ id, since, text }] }`, jede Nacht neu datiert (Format prüft `tests/smoke/vote.spec.js`) |
| `content/tiles.js` | Geländetypen |
| `content/creatures.js` | Kreaturentypen |
| `content/items.js` | Gegenstände: mit `atk` (und `hitVerb`) eine Waffe, mit `slot` (`head`, `body`, `feet`) und `def` ein Rüstungsteil, sonst ein Ding für den Beutel; `text` ist die Beschreibung im Fenster GEAR |
| `content/quests.js` | Quests (seit Tag 5): `giver`, `startItem`, `item`/`count`, Texte, `reward: { item, xp }` |
| `content/recipes.js` | Rezepte für die Werkbank: `needs` (gleiche Einträge mehrfach = so viele davon), `makes`, `text`, `hint` |
| `content/levels.js` | Stufenleiter `LEVELS` (`xp` gesamt, `maxHp`/`atk` pro Aufstieg) und `LEVEL_UP_TEXT` |
| `content/wheel.js` | Glücksrad: `cost`, Texte, `wedges` mit `weight`, `effect`, `text` und Parametern |
| `content/world.js` | Karten, Objekte, Spawns, Spielerwerte, Startpunkt |
| `content/chronicle.js` | Chronik im Spiel, der letzte Eintrag legt die Tageszahl fest |
| `tests/smoke/` | Allgemeine Tests, die immer gelten (geschützt) |
| `tests/day/` | Tests pro Neuerung |
| `tests/fixtures/` | Alte Spielstände, die immer ladbar bleiben müssen |
| `src/chat.js` | Chat: ab 1000 px fest rechts neben dem Spiel (`#chat-pane` in `.layout`) und immer verbunden, schmaler als Vollbild über `[ CHAT ]`; liest per WebSocket, Schreiben mit Tagesticket nach Captcha (geschützt) |
| `worker/chat.js` | Chatraum als Durable Object: Verlauf (200), Wortfilter, keine Links, Rate-Limit, Melden (3 Meldungen verstecken), Admin (geschützt) |
| `tools/chat-admin.mjs` | Moderation für Chris: `list`, `hide <id>`, `mute <name>` (Schlüssel nur lokal, geschützt) |
| `worker/` | Cloudflare Worker: `POST /` legt Vorschläge unter `suggestions/` ab, `POST /vote` Stimmen unter `votes/`, `POST /rate` Bewertungen unter `ratings/`, `POST /event` Event-Beiträge unter `events/` im Inbox-Repo (ohne Captcha, Zähler in KV für die Anzeige); je ein Vorschlag und eine Stimme pro Nacht und Anschluss (geschützt) |

## Oberfläche

`index.html` ist gegliedert in `.statusbar` (Titel, `#day-label`, Menüs TONIGHT, SHAPE TOMORROW, ARCHIVE, Countdown, CRT-Schalter), und `.layout` mit `.play` (Karte `#world` mit Quest-Log `#quest-log` und Event-Hinweis `#event-toast` darüber, HUD mit Bewertung, Log, Steuerkreuz) und am PC der Chat-Spalte. Die Seite ist genau einen Bildschirm hoch und scrollt nicht; die Karte füllt den freien Platz, so groß es geht, ohne Verzerrung (`.map-frame` mit Container-Einheiten, `--map-ratio` setzt `src/render.js`). Die Figur eines laufenden Events trägt auf der Karte einen Rahmen mit „!“-Abzeichen, bis man mit ihr gesprochen hat (`src/render.js`, nur in der aktuellen Nacht). Tests dazu in `tests/smoke/ui.spec.js`.

- **Neuer Menüpunkt:** `<div class="menu">` mit `<button class="menu-button" aria-controls="panel-x">` und `<section id="panel-x" class="menu-panel window" hidden>` in `.menus`; die Logik in `setupMenus()` (`src/main.js`) greift von selbst. Im Panel erst ein Satz, was das ist, dann die Punkte als `<dl class="menu-list">` mit Knopf und Erklärung.
- **Steuerkreuz und Log:** Das Steuerkreuz `.pad` gibt es nur auf Touchgeräten (`pointer: coarse`), halbdurchsichtig unten rechts über der Karte. Das Log lässt sich überall einklappen (`#log-toggle`, gespeichert als `overnight.log`), dann zeigt `#log-peek` die neueste Zeile in der Titelleiste. `src/render.js` zeigt auf schmalen Bildschirmen 12 Spalten und so viele Zeilen, wie in den Rahmen passen, und passt das bei Größenänderungen an (ResizeObserver).
- **Icon:** `icon.svg` (Pixel-Mondsichel im CRT-Look) und `icon-180.png` für Homescreens.
- **Neue Anzeige zum Spielstand** gehört in `drawHud()` in `src/main.js` (Zeile unter der Karte). Dort stehen HP-Leiste und Chips (`LV`, `WPN`, `DEF`, `BAG`); gleiche Dinge im Beutel werden gezählt. Daneben der Knopf `#open-gear`.
- **Fenster GEAR** (seit Tag 5): `<dialog id="gear-dialog">`, gefüllt von `drawGear()` in `src/main.js`: Werte (`#gear-stats`), Getragenes (`#gear-worn`), Beutel (`#gear-bag`) mit Knöpfen `.gear-equip`, die `equip()` aus `src/game.js` aufrufen. Taste I (oder G) öffnet es. Weitere Fenstertasten in `WINDOW_KEYS`. Nichts dauerhaft zwischen Karte und Log stellen, was viel Höhe braucht: Die Karte bekommt nur, was übrig bleibt.
- **Farben** nur über die Tokens in `:root` von `style.css` (`--text`, `--accent`, `--muted`, `--bright`, `--good`, `--danger`, `--line`, `--panel`). Keine festen Höhen im Spielbereich, sonst rutscht am Handy das Steuerkreuz aus dem Bild.
- **Knöpfe** bekommen die eckigen Klammern per CSS; im HTML steht nur der Text. Links, die wie Knöpfe aussehen sollen, haben `class="button"`.
- **`src/terminal.js`:** Bootsequenz (einmal pro Tag, blockiert keine Eingabe), Countdown bis Mitternacht in Berlin, CRT-Schalter (`overnight.crt` in `localStorage`). `src/render.js` lässt die Zeichen leicht leuchten, wenn CRT an ist.
- **Schrift:** `fonts/vt323.woff2` (OFL, Lizenz in `fonts/OFL.txt`), nur für die Oberfläche; die Karte nutzt eine Systemschrift, weil VT323 Zeichen wie `♣` und `π` fehlen.

## Systeme

- **Züge:** `act()` nimmt `up`, `down`, `left`, `right` oder `wait`. Reihenfolge beim Laufen: Kreatur angreifen, sonst Objekt benutzen, sonst laufen. Gegen nicht begehbares Gelände zu laufen kostet keine Runde.
- **Objekte:** Einträge in `entities` einer Karte. `kind` wählt das Verhalten aus `INTERACTIONS` in `src/game.js`. Bisher: `npc`, `sign`, `well`, `pickup`, `door`, `bench`, `wheel`, `chest`, `gate`. `chest` gibt einmal `item` und bleibt offen stehen (`flags.opened`, Zeichen `openGlyph`). `gate` verschwindet für immer (`flags.taken`), sobald der Spieler `key` dabeihat (der Schlüssel wird verbraucht). `well` mit `down: { map, x, y }`: Wer mit vollen HP hineinläuft, landet dort (seit Tag 5). `door` hat `to: { map, x, y }` und wechselt über `enterMap()` die Karte; das Ankunftsfeld muss begehbar und frei sein (Test in `tests/day/002-door.spec.js`). `pickup` mit `item` gibt den Gegenstand über `giveItem()` (Waffe nach `player.weapon`, die alte Waffe in den Beutel; sonst nach `player.bag`) und setzt `flags.taken[id]`; `bench` baut das erste Rezept, für das `hasItem()` alles findet, verbraucht die Zutaten und gibt das Ergebnis; `visibleEntities(s)` blendet aufgenommene Objekte aus (Logik und Zeichnen nutzen es). `npc` kann `itemLines` haben: eine einmalige Bemerkung, sobald der Spieler den Gegenstand trägt (gemerkt in `flags.heard`).
- **Stufen (seit Tag 4):** `player.xp`, `player.level` (ab 1). Siege geben `xp` aus der Kreaturdefinition über `gainXp()`, das auch `stats.xp` erhöht und Aufstiege nach `content/levels.js` ausführt (max HP, Angriff, volle Heilung). `nextLevelXp(s)` liefert die nächste Schwelle oder `null`.
- **Rüstung (seit Tag 5):** `player.armor = { head, body, feet }`. `defenseOf(s)` summiert `def`, `damageFrom(s, def)` ist `max(1, atk - Abwehr)`. `giveItem()` zieht Rüstung an, wenn der Platz frei ist, sonst Beutel. `equip(s, id)` legt Waffe oder Rüstung aus dem Beutel an (keine Runde), das Alte kommt in den Beutel. `countItem(s, id)` zählt Beutel, Waffe und Rüstung; `takeItem()` nimmt zuerst aus dem Beutel.
- **Quests (seit Tag 5):** Im `npc`-Gespräch nach dem Event-Hinweis: `talkQuest()` bietet die Quest an (sobald `startItem` dabei ist), schließt sie ab (Zutaten weg, Belohnung) oder erinnert abwechselnd mit den normalen Sätzen (`flags.questNag`). Zustand `flags.quests[id]` (`active`/`done`), abfragbar mit `questState(s, id)`.
- **Bosse (seit Tag 5):** Kreaturen mit `boss: true` verschwinden beim Sieg, `flags.slain[type]` verhindert, dass ihr Spawn je wieder erscheint.
- **Glücksrad (seit Tag 4):** Objektart `wheel`. Einmal pro Nacht umsonst (`flags.wheelDay` = `currentDay()`), danach kostet es `WHEEL.cost` aus dem Beutel. `flags.spins` zählt Drehungen. Effekte stehen in `WHEEL_EFFECTS` in `src/game.js` (`xp`, `heal`, `item`, `visitor`, `nothing`, `maxHp`); ein Feld mit `unique` fällt auf das erste `xp`-Feld zurück, wenn der Spieler das Ding schon hat.
- **Beute:** Kreaturen mit `drops: [{ item, chance }]` geben beim Sieg manchmal Gegenstände (jeder Eintrag einzeln gewürfelt, seit Tag 5 eine Liste).
- **Gelände:** Objekte müssen auf begehbaren Feldern stehen (Smoke-Test). Für Dinge "im Wasser" gibt es deshalb die begehbare flache Stelle `s` (seit Tag 3). Seit Tag 4 gibt es `e` (ausradiert, `░`, nicht begehbar).
- **Angriff:** Immer `attackOf(s)` verwenden, das ist `player.atk` plus Bonus der Waffe.
- **Kreaturen:** `ai` wählt das Verhalten aus `AI_BEHAVIOURS` in `src/game.js`. Bisher: `skulk` (Ratten), `hop` (Frösche, seit Tag 4: jede ungerade Runde Pause, sonst zwei Schritte), `lurk` (Aale, seit Tag 5: bewegen sich nie, beißen daneben) und `trudge` (Krümelhaufen: ein Schritt jede gerade Runde). Gemeinsames Heranlaufen in `approach()`. `biteVerb` ändert die Angriffsmeldung. Kreaturen mit `once: true` (Besucher vom Rad) werden beim Sieg entfernt statt neu gesetzt. Besiegte Kreaturen kommen nach `respawnTurns` zurück, wenn der Spieler weit genug weg ist.
- **Zufall:** Immer `random(s)` aus `src/game.js` verwenden, nie `Math.random()`, sonst sind Tests nicht wiederholbar.
- **Karten:** `content/world.js` hat bisher `meadow` (Start), `draft` (Rough Draft, seit Tag 2) und `drains` (seit Tag 5, 32 x 13, größer als der Ausschnitt; Leiter zum Brunnen, Gitter zum Rough Draft, Sumpf hinter `sump-gate`). Geländezeichen der Kanäle: `W` Backstein, `_` Boden, `c` Kanal, `p` Planke. Jeder Kartenwechsel läuft über `enterMap()` in `src/game.js`, das die Kreaturen der Zielkarte frisch setzt. Die Anzeige oben zeigt den `name` der Karte.
- **Echos (seit Tag 6):** andere Spieler auf derselben Karte erscheinen als blasses `@` in `PRESENCE.color`, Name klein darüber, eine Geste kurz als Sprechblase (`render.js`, Option `echoes`). Über der Karte steht `#echo-count` („· 2 here · 5 out there“), unter der HP-Leiste die Gesten-Knöpfe `#emotes` (Tasten aus `PRESENCE.emotes`). Echos sind keine Objekte der Spiellogik: Sie blockieren nichts, kämpfen nicht und sind nicht im Spielstand. Gemeinsames Spiel baut auf Gesten auf (z. B. eine Figur, die nur antwortet, wenn zwei Spieler gleichzeitig `help` zeigen) und braucht für neue Nachrichtenarten Chris im Worker. `window.__overnight.echoes` gibt `here()`, `total()`, `bubbleOf(id)`, `active`.
- **Niederlage:** Spieler wacht am `START` mit vollen HP auf, die Kreaturen werden neu gesetzt (auch aus anderen Karten zurück auf die Wiese).

## Spielstand

`localStorage` unter `overnight.save`, Archivversionen unter `overnight.save.dayNNN`. Gespeichert werden `version`, `map`, `player`, `turn`, `flags`, `stats`, `lastSeenDay`. Kreaturen werden absichtlich nicht gespeichert. Steht der Spieler nach einem Update auf einem nicht begehbaren Feld, kommt er zurück zum Start.

Aktuelle `SAVE_VERSION`: 1. Seit Tag 1 gibt es das optionale Feld `player.weapon` (fehlt es, gilt `null`) und die Flags `taken` und `heard`. Das ist abwärtskompatibel, daher keine neue Version; Fixture `save-v1-day1-stick.json`. Seit Tag 2 kann `map` auch `draft` sein, ebenfalls ohne neue Version; Fixture `save-v1-day2-draft.json`. Seit Tag 3 gibt es das optionale Feld `player.bag` (Liste von Gegenstands-IDs; fehlt es, gilt `[]`, unbekannte IDs werden beim Laden verworfen), ohne neue Version; Fixture `save-v1-day3-bag.json`. Seit Tag 4 gibt es `player.xp` und `player.level` (fehlen sie oder sind ungültig, gelten 0 und 1), `stats.xp` sowie die Flags `wheelDay` und `spins`; der Beutel darf Dinge mehrfach enthalten. Ohne neue Version; Fixture `save-v1-day4-level.json`. Seit Tag 5 gibt es `player.armor` (fehlt es, sind alle Plätze leer; Unbekanntes oder ein Teil im falschen Platz wird verworfen) und die Flags `opened`, `quests`, `questNag`, `slain`; `map` kann `drains` sein. Ohne neue Version; Fixture `save-v1-day5-gear.json`.

## Testschnittstelle

`window.__overnight` bietet `state`, `day`, `act(action)` und `echoes`. Die Smoke-Tests hängen davon ab, sie darf nur erweitert werden.

## Veröffentlichung

Der Deploy schreibt außerdem `timelapse/days.js`: pro archivierter Nacht Chronik-Eintrag und Welt als Daten (Karten, Gelände, Figuren, Türen) aus `day/NNN/content/`, ohne Browser. Ein neues Gebiet erscheint in der Weltkarte automatisch, wenn eine Tür (`to: { map }`) dorthin führt, sonst in einer Reihe darunter. Für das Vorschaubild nimmt `timelapse.mjs` pro Nacht ein Bild auf (frischer Browser, `?seed=1`, nur das Canvas). Scheitert etwas davon, geht die Seite trotzdem raus.

Ein PR von `claude/day-NNN` wird von `.github/workflows/nightly-gate.yml` geprüft und gemergt, danach taggt der Workflow `day-NNN` und startet den Deploy. `.github/workflows/deploy.yml` baut die Seite aus `main` und legt für jeden Tag eine spielbare Kopie unter `day/NNN/` an. Fehlschläge lassen die Live-Seite unverändert.

Grenzen pro PR: 1000 geänderte Zeilen außerhalb von `content/`, `tests/` und Doku. Bis 3000 nur mit `Big-Change: #N` in der PR-Beschreibung und einem `ja`-Kommentar von Chris auf dem `big-change`-Issue. Der Workflow schließt das Issue nach dem Merge.
