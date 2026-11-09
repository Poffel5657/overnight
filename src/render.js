// Zeichnet die Welt als Schriftzeichen auf das Canvas.
import { MAPS } from '../content/world.js';
import { CREATURES } from '../content/creatures.js';
import { tileAt, visibleEntities, activeEvent } from './game.js';

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
// marker: ob die Figur eines laufenden Events markiert wird (nicht in archivierten Nächten).
// Lebensbalken für Gegner: null, wenn keiner nötig ist (unverletzt und kein Boss), sonst Anteil und Farbe.
export function hpBar(hp, maxHp, boss = false) {
  if (!(maxHp > 0) || hp <= 0) return null;
  const ratio = Math.min(hp / maxHp, 1);
  if (ratio >= 1 && !boss) return null;
  const color = ratio > 0.6 ? '#9ccf6a' : ratio > 0.3 ? '#ffb347' : '#e05a47';
  return { ratio, color };
}

// echoes: Funktion, die { list, color, chatOf } für andere Spieler auf dieser Karte liefert (siehe main.js).
export function createRenderer(canvas, { glow = () => false, marker = true, echoes = null } = {}) {
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

  // Dünner Balken an der Unterkante des Feldes, dunkler Grund, Füllung nach Rest-HP.
  function drawHpBar(col, row, bar) {
    if (!bar) return;
    const x = col * CELL + 3;
    const y = row * CELL + CELL - 5;
    const width = CELL - 6;
    ctx.save();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(11, 9, 6, 0.85)';
    ctx.fillRect(x - 1, y - 1, width + 2, 5);
    ctx.fillStyle = bar.color;
    ctx.fillRect(x, y, Math.max(1, Math.round(width * bar.ratio)), 3);
    ctx.restore();
  }

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

    // Offene Truhen (seit Tag 5) zeigen openGlyph.
    for (const e of visibleEntities(s)) {
      figure(e.x, e.y, s.flags.opened?.[e.id] && e.openGlyph ? e.openGlyph : e.glyph, e.color);
    }

    // Event-Figur, mit der man noch nicht gesprochen hat: leuchtender Rahmen und ein "!" in der Ecke.
    const event = marker && activeEvent();
    const giver = event && !s.flags.eventsHeard?.[event.id] && visibleEntities(s).find((e) => e.id === event.giver);
    if (giver) {
      const gx = (giver.x - camX) * CELL;
      const gy = (giver.y - camY) * CELL;
      ctx.save();
      ctx.strokeStyle = '#ffb347';
      ctx.shadowColor = '#ffb347';
      ctx.shadowBlur = 8;
      ctx.lineWidth = 2;
      ctx.strokeRect(gx + 1, gy + 1, CELL - 2, CELL - 2);
      // Abzeichen: gefülltes Kästchen oben rechts mit dunklem "!".
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffb347';
      ctx.fillRect(gx + CELL - 12, gy - 4, 14, 16);
      ctx.font = `bold ${Math.round(CELL * 0.45)}px ui-monospace, monospace`;
      ctx.fillStyle = '#1a1006';
      ctx.fillText('!', gx + CELL - 5, gy + 5);
      ctx.restore();
    }
    for (const c of s.creatures) {
      if (c.respawnAt === null) {
        const def = CREATURES[c.type];
        figure(c.x, c.y, def.glyph, def.color);
        drawHpBar(c.x - camX, c.y - camY, hpBar(c.hp, def.hp, def.boss));
      }
    }
    drawEchoes(s, camX, camY, figure);
    // Mit Tintenring (Zauber WARD, seit Tag 7) erscheint der Spieler in Tintenblau.
    figure(s.player.x, s.player.y, '@', s.player.ward > 0 ? '#7f9cf5' : '#ffffff');
    drawChats(s, camX, camY);
  }

  // Sprechblase aus dem Chat über einer Figur: höchstens drei Zeilen, mit Spitze nach unten.
  const BUBBLE_CHARS = 24;
  const BUBBLE_LINES = 3;
  function wrap(text) {
    const lines = [];
    let line = '';
    for (const word of text.split(' ')) {
      const parts = word.match(new RegExp(`.{1,${BUBBLE_CHARS}}`, 'g')) ?? [''];
      for (const part of parts) {
        if (!line) line = part;
        else if (line.length + 1 + part.length <= BUBBLE_CHARS) line += ` ${part}`;
        else {
          lines.push(line);
          line = part;
        }
      }
    }
    if (line) lines.push(line);
    if (lines.length > BUBBLE_LINES) {
      lines.length = BUBBLE_LINES;
      lines[BUBBLE_LINES - 1] = `${lines[BUBBLE_LINES - 1].slice(0, BUBBLE_CHARS - 1)}…`;
    }
    return lines;
  }

  function speech(px, top, text) {
    const lines = wrap(text);
    const lineHeight = Math.round(CELL * 0.38);
    ctx.font = `${Math.round(CELL * 0.34)}px ui-monospace, monospace`;
    const width = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 10;
    const height = lines.length * lineHeight + 6;
    const viewWidth = VIEW_COLS * CELL;
    // Am Rand nicht aus dem Bild ragen.
    const left = Math.min(Math.max(px - width / 2, 2), viewWidth - width - 2);
    const y = Math.max(top - height - 6, 2);
    ctx.fillStyle = 'rgba(11, 9, 6, 0.9)';
    ctx.strokeStyle = '#ffb347';
    ctx.lineWidth = 1;
    ctx.fillRect(left, y, width, height);
    ctx.strokeRect(left + 0.5, y + 0.5, width - 1, height - 1);
    ctx.beginPath();
    ctx.moveTo(px - 4, y + height);
    ctx.lineTo(px, y + height + 5);
    ctx.lineTo(px + 4, y + height);
    ctx.fill();
    ctx.fillStyle = '#ffe2b0';
    lines.forEach((l, i) => ctx.fillText(l, left + width / 2, y + 3 + lineHeight * (i + 0.5)));
  }

  // Chatnachricht als Sprechblase über dem Schreiber (auch über dem eigenen Spieler).
  function drawChats(s, camX, camY) {
    const info = echoes?.();
    if (!info?.chatOf) return;
    const chats = [];
    const own = info.chatOf(null);
    if (own) chats.push({ x: s.player.x, y: s.player.y, text: own });
    for (const peer of info.list) {
      const text = info.chatOf(peer.name);
      if (text) chats.push({ x: peer.x, y: peer.y, text });
    }
    if (!chats.length) return;
    ctx.save();
    ctx.shadowBlur = 0;
    for (const chat of chats) speech((chat.x - camX) * CELL + CELL / 2, (chat.y - camY) * CELL - 4, chat.text);
    ctx.restore();
  }

  // Echos: andere Spieler als blasses "@", Name klein darüber.
  function drawEchoes(s, camX, camY, figure) {
    const info = echoes?.();
    if (!info?.list.length) return;
    for (const peer of info.list) figure(peer.x, peer.y, '@', info.color);
    ctx.save();
    ctx.shadowBlur = 0;
    ctx.font = `${Math.round(CELL * 0.3)}px ui-monospace, monospace`;
    for (const peer of info.list) {
      const px = (peer.x - camX) * CELL + CELL / 2;
      const py = (peer.y - camY) * CELL;
      const width = ctx.measureText(peer.name).width + 6;
      ctx.fillStyle = 'rgba(11, 9, 6, 0.75)';
      ctx.fillRect(px - width / 2, py - 7, width, 12);
      ctx.fillStyle = info.color;
      ctx.fillText(peer.name, px, py);
    }
    ctx.restore();
  }
  return draw;
}
