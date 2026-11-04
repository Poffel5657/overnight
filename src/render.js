// Zeichnet die Welt als Schriftzeichen auf das Canvas.
import { MAPS } from '../content/world.js';
import { CREATURES } from '../content/creatures.js';
import { tileAt } from './game.js';

// Auf schmalen Bildschirmen wird ein kleinerer Ausschnitt gezeigt, damit die Zeichen lesbar bleiben.
const NARROW = window.innerWidth < 600;
const VIEW_COLS = NARROW ? 15 : 25;
const VIEW_ROWS = NARROW ? 11 : 13;
const CELL = 32;
const FONT = `bold ${Math.round(CELL * 0.72)}px ui-monospace, "DejaVu Sans Mono", Menlo, Consolas, monospace`;

export function createRenderer(canvas) {
  const scale = Math.max(window.devicePixelRatio || 1, 1);
  canvas.width = VIEW_COLS * CELL * scale;
  canvas.height = VIEW_ROWS * CELL * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = FONT;

  const cell = (col, row, glyph, fg, bg) => {
    if (bg) {
      ctx.fillStyle = bg;
      ctx.fillRect(col * CELL, row * CELL, CELL, CELL);
    }
    if (glyph && glyph !== ' ') {
      ctx.fillStyle = fg;
      ctx.fillText(glyph, col * CELL + CELL / 2, row * CELL + CELL / 2 + 1);
    }
  };

  // Kamera folgt dem Spieler, sobald eine Karte größer als der Ausschnitt ist.
  const cameraAxis = (pos, size, view) =>
    size <= view
      ? -Math.floor((view - size) / 2)
      : Math.min(Math.max(pos - Math.floor(view / 2), 0), size - view);

  return function draw(s) {
    const map = MAPS[s.map];
    const width = Math.max(...map.tiles.map((row) => row.length));
    const camX = cameraAxis(s.player.x, width, VIEW_COLS);
    const camY = cameraAxis(s.player.y, map.tiles.length, VIEW_ROWS);

    ctx.clearRect(0, 0, VIEW_COLS * CELL, VIEW_ROWS * CELL);
    for (let row = 0; row < VIEW_ROWS; row += 1) {
      for (let col = 0; col < VIEW_COLS; col += 1) {
        const tile = tileAt(s.map, col + camX, row + camY);
        cell(col, row, tile.glyph, tile.fg, tile.bg);
      }
    }
    // Figuren übermalen das Geländezeichen ihres Feldes, sonst verschmelzen die beiden Zeichen.
    const figure = (x, y, glyph, color) =>
      cell(x - camX, y - camY, glyph, color, tileAt(s.map, x, y).bg);

    for (const e of map.entities) figure(e.x, e.y, e.glyph, e.color);
    for (const c of s.creatures) {
      if (c.respawnAt === null) {
        const def = CREATURES[c.type];
        figure(c.x, c.y, def.glyph, def.color);
      }
    }
    figure(s.player.x, s.player.y, '@', '#ffffff');
  };
}
