// Zeichnet die Welt als Schriftzeichen auf das Canvas.
import { MAPS } from '../content/world.js';
import { CREATURES } from '../content/creatures.js';
import { tileAt, visibleEntities } from './game.js';

// Breite Bildschirme zeigen einen festen Ausschnitt von 25 x 13 Feldern.
// Schmale Bildschirme (Handy hochkant) zeigen 12 Spalten mit großen Zeichen und so viele Zeilen,
// wie in den Kartenrahmen passen, damit die Karte den Rahmen wirklich füllt.
const WIDE_VIEW = { cols: 25, rows: 13 };
const NARROW_COLS = 12;
const MIN_ROWS = 7;
const MAX_ROWS = 25;
const CELL = 32;

function viewFor(frame) {
  if (window.innerWidth >= 600 || !frame || !frame.clientWidth || !frame.clientHeight) return WIDE_VIEW;
  const cell = frame.clientWidth / NARROW_COLS;
  const rows = Math.min(MAX_ROWS, Math.max(MIN_ROWS, Math.floor(frame.clientHeight / cell)));
  return { cols: NARROW_COLS, rows };
}
const FONT = `bold ${Math.round(CELL * 0.72)}px ui-monospace, "DejaVu Sans Mono", Menlo, Consolas, monospace`;

// glow: Funktion, die sagt, ob die Zeichen leicht leuchten sollen (CRT-Einstellung).
export function createRenderer(canvas, { glow = () => false } = {}) {
  const ctx = canvas.getContext('2d');
  const frame = canvas.parentElement;
  let VIEW_COLS = 0;
  let VIEW_ROWS = 0;
  let last = null;

  // Passt den Ausschnitt an den Rahmen an. Gibt true zurück, wenn sich etwas geändert hat.
  function resize() {
    const view = viewFor(frame);
    if (view.cols === VIEW_COLS && view.rows === VIEW_ROWS) return false;
    VIEW_COLS = view.cols;
    VIEW_ROWS = view.rows;
    const scale = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = VIEW_COLS * CELL * scale;
    canvas.height = VIEW_ROWS * CELL * scale;
    // Seitenverhältnis für das CSS, damit die Karte den Rahmen füllt, ohne verzerrt zu werden.
    canvas.style.setProperty('--map-ratio', `${VIEW_COLS} / ${VIEW_ROWS}`);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = FONT;
    return true;
  }
  resize();
  if (frame && 'ResizeObserver' in window) {
    new ResizeObserver(() => { if (resize() && last) draw(last); }).observe(frame);
  }

  const cell = (col, row, glyph, fg, bg) => {
    if (bg) {
      ctx.shadowBlur = 0;
      ctx.fillStyle = bg;
      ctx.fillRect(col * CELL, row * CELL, CELL, CELL);
    }
    if (glyph && glyph !== ' ') {
      ctx.fillStyle = fg;
      ctx.shadowColor = fg;
      ctx.shadowBlur = glow() ? 6 : 0;
      ctx.fillText(glyph, col * CELL + CELL / 2, row * CELL + CELL / 2 + 1);
    }
  };

  // Kamera folgt dem Spieler, sobald eine Karte größer als der Ausschnitt ist.
  const cameraAxis = (pos, size, view) =>
    size <= view
      ? -Math.floor((view - size) / 2)
      : Math.min(Math.max(pos - Math.floor(view / 2), 0), size - view);

  function draw(s) {
    last = s;
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

    for (const e of visibleEntities(s)) figure(e.x, e.y, e.glyph, e.color);
    for (const c of s.creatures) {
      if (c.respawnAt === null) {
        const def = CREATURES[c.type];
        figure(c.x, c.y, def.glyph, def.color);
      }
    }
    figure(s.player.x, s.player.y, '@', '#ffffff');
  }
  return draw;
}
