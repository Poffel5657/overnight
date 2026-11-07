// Weltkarte einer Nacht: alle Gebiete auf einer großen Karte, über ihre Türen nebeneinandergelegt.
// Die Daten (world in days.js) schreibt der Deploy mit .github/scripts/timelapse-days.mjs:
// { start, maps: { id: { name, tiles, figures, doors } }, tiles: { Zeichen: { glyph, fg, bg } } }.

const GAP = 3; // freie Felder zwischen zwei Gebieten
const LABEL = 2; // Zeilen über jedem Gebiet für den Namen
const CELL = 16;
const FONT = `bold ${Math.round(CELL * 0.72)}px ui-monospace, "DejaVu Sans Mono", Menlo, Consolas, monospace`;
const LABEL_FONT = `${Math.round(CELL * 1.1)}px VT323, ui-monospace, monospace`;
const VOID = '#050508';

const widthOf = (map) => Math.max(0, ...map.tiles.map((row) => row.length));

const overlaps = (a, b) =>
  a.x < b.x + b.w + GAP && b.x < a.x + a.w + GAP && a.y < b.y + b.h + GAP && b.y < a.y + a.h + GAP;

// Legt die Gebiete aus: Startgebiet bei (0, 0), jedes über eine Tür erreichbare Gebiet an die Seite,
// an der die Tür liegt, auf Höhe der Tür. Gebiete ohne Verbindung kommen in eine Reihe darunter.
export function layout(world) {
  const ids = Object.keys(world.maps);
  const first = world.start?.map in world.maps ? world.start.map : ids[0];
  const rects = {};
  const links = [];
  if (!first) return { rects, links, bounds: { x: 0, y: 0, w: 1, h: 1 } };

  const box = (id) => ({ w: widthOf(world.maps[id]), h: world.maps[id].tiles.length + LABEL });
  const free = (r) => Object.values(rects).every((other) => !overlaps(r, other));
  rects[first] = { x: 0, y: 0, ...box(first) };

  const queue = [first];
  while (queue.length) {
    const from = queue.shift();
    const a = rects[from];
    for (const door of world.maps[from].doors) {
      const to = door.to.map;
      if (!(to in world.maps)) continue;
      links.push({ from, to, x: door.x, y: door.y, tx: door.to.x, ty: door.to.y });
      if (rects[to]) continue;
      const { w, h } = box(to);
      // Seite: die Kante des Gebiets, der die Tür am nächsten liegt.
      const sides = [
        ['right', a.w - 1 - door.x], ['left', door.x],
        ['down', a.h - LABEL - 1 - door.y], ['up', door.y],
      ].sort((p, q) => p[1] - q[1]);
      const side = sides[0][0];
      const r = { w, h, x: 0, y: 0 };
      if (side === 'right' || side === 'left') {
        r.x = side === 'right' ? a.x + a.w + GAP : a.x - w - GAP;
        r.y = a.y + door.y - (door.to.y ?? 0);
      } else {
        r.y = side === 'down' ? a.y + a.h + GAP : a.y - h - GAP;
        r.x = a.x + door.x - (door.to.x ?? 0);
      }
      const step = { right: [1, 0], left: [-1, 0], down: [0, 1], up: [0, -1] }[side];
      for (let i = 0; i < 200 && !free(r); i += 1) { r.x += step[0]; r.y += step[1]; }
      rects[to] = r;
      queue.push(to);
    }
  }

  // Gebiete ohne Tür dorthin: eine Reihe unter allem anderen.
  let bottom = Math.max(...Object.values(rects).map((r) => r.y + r.h)) + GAP;
  let left = Math.min(...Object.values(rects).map((r) => r.x));
  for (const id of ids) {
    if (rects[id]) continue;
    rects[id] = { x: left, y: bottom, ...box(id) };
    left += rects[id].w + GAP;
  }

  const all = Object.values(rects);
  const x0 = Math.min(...all.map((r) => r.x));
  const y0 = Math.min(...all.map((r) => r.y));
  const x1 = Math.max(...all.map((r) => r.x + r.w));
  const y1 = Math.max(...all.map((r) => r.y + r.h));
  return { rects, links, bounds: { x: x0 - 1, y: y0 - 1, w: x1 - x0 + 2, h: y1 - y0 + 2 } };
}

// Felder eines Gebiets, die sich gegenüber der Vornacht geändert haben (Gelände oder Figur), als "x,y".
function changedCells(map, old) {
  const changed = new Set();
  if (!old) return changed;
  const figures = (m) => new Map(m.figures.map((f) => [`${f.x},${f.y}`, f.glyph]));
  const now = figures(map);
  const then = figures(old);
  const rows = Math.max(map.tiles.length, old.tiles.length);
  for (let y = 0; y < rows; y += 1) {
    const cols = Math.max(map.tiles[y]?.length ?? 0, old.tiles[y]?.length ?? 0);
    for (let x = 0; x < cols; x += 1) {
      const key = `${x},${y}`;
      const tileNow = map.tiles[y]?.[x] ?? ' ';
      if (tileNow !== (old.tiles[y]?.[x] ?? ' ') || now.get(key) !== then.get(key)) {
        // Verschwundenes außerhalb der heutigen Karte lässt sich nicht zeigen.
        if (tileNow !== ' ' || now.has(key)) changed.add(key);
      }
    }
  }
  return changed;
}

// Zeichnet die Weltkarte auf das Canvas. before: Welt der Vornacht (oder null) für die Hervorhebungen.
// Gibt die Größe in Feldern zurück, damit die Seite die Karte passend groß anzeigen kann.
export function drawAtlas(canvas, world, { before = null, accent = '#ffb347', muted = '#8a7a60' } = {}) {
  const { rects, links, bounds } = layout(world);
  const scale = Math.max(window.devicePixelRatio || 1, 1) * 2;
  canvas.width = bounds.w * CELL * scale;
  canvas.height = bounds.h * CELL * scale;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.fillStyle = VOID;
  ctx.fillRect(0, 0, bounds.w * CELL, bounds.h * CELL);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const px = (id, x) => (rects[id].x - bounds.x + x) * CELL;
  const py = (id, y) => (rects[id].y - bounds.y + LABEL + y) * CELL;
  const empty = world.tiles[' '] ?? { glyph: ' ', bg: VOID };
  const tile = (map, x, y) => world.tiles[map.tiles[y]?.[x] ?? ' '] ?? empty;

  const glyph = (x, y, char, fg, bg) => {
    if (bg) { ctx.fillStyle = bg; ctx.fillRect(x, y, CELL, CELL); }
    if (char && char !== ' ') { ctx.fillStyle = fg; ctx.fillText(char, x + CELL / 2, y + CELL / 2 + 1); }
  };

  // Verbindungen zuerst, damit die Gebiete darüber liegen.
  ctx.save();
  ctx.strokeStyle = '#a8703a';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  for (const link of links) {
    ctx.beginPath();
    ctx.moveTo(px(link.from, link.x) + CELL / 2, py(link.from, link.y) + CELL / 2);
    ctx.lineTo(px(link.to, link.tx) + CELL / 2, py(link.to, link.ty) + CELL / 2);
    ctx.stroke();
  }
  ctx.restore();

  for (const [id, map] of Object.entries(world.maps)) {
    ctx.font = FONT;
    const w = rects[id].w;
    for (let y = 0; y < map.tiles.length; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const t = tile(map, x, y);
        glyph(px(id, x), py(id, y), t.glyph, t.fg, t.bg);
      }
    }
    // Figuren übermalen das Geländezeichen ihres Feldes, wie im Spiel.
    const figure = (x, y, char, color) => glyph(px(id, x), py(id, y), char, color, tile(map, x, y).bg);
    for (const f of map.figures) figure(f.x, f.y, f.glyph, f.color);
    if (world.start?.map === id) figure(world.start.x, world.start.y, '@', '#ffffff');

    // Was in dieser Nacht dazukam oder sich änderte, bekommt einen Rahmen.
    const isNew = Boolean(before) && !(id in before.maps);
    ctx.save();
    ctx.strokeStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 6;
    ctx.lineWidth = 1.5;
    for (const key of changedCells(map, before?.maps[id])) {
      const [x, y] = key.split(',').map(Number);
      ctx.strokeRect(px(id, x) + 1, py(id, y) + 1, CELL - 2, CELL - 2);
    }
    ctx.restore();

    // Name über dem Gebiet, neue Gebiete hervorgehoben.
    ctx.font = LABEL_FONT;
    ctx.textAlign = 'left';
    ctx.fillStyle = isNew ? accent : muted;
    const name = map.name.toUpperCase();
    ctx.fillText(isNew ? `${name}  · NEW` : name, px(id, 0), py(id, -1));
    ctx.textAlign = 'center';
  }
  return { cols: bounds.w, rows: bounds.h };
}
