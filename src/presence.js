// Echos: andere Spieler in derselben Welt. Geschützte Datei: Netzwerkzugriff wie chat.js.
// Das Spiel meldet dem Worker nur die eigene Position (Karte, x, y) und Gesten aus einer festen Liste.
// Zurück kommen Positionen und Gesten der anderen mit ihren anonymen Tagesnamen. Kein Freitext.
// Alles kommt als Text ins DOM (textContent), nie als HTML.
import { SUGGEST_URL } from './config.js';

const SEND_GAP_MS = 150;
const HIDDEN_CLOSE_MS = 60_000;
const BUBBLE_MS = 3500;
const NAME = /^[a-z]+-[0-9a-f]{3}$/;
const ID = /^[0-9a-f]{1,12}$/;
const coord = (v) => Number.isInteger(v) && v >= 0 && v <= 255;

// Liest eine Nachricht vom Worker. Unbekanntes oder Kaputtes wird verworfen.
export function readMessage(raw, knownMap) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (data?.t === 'hello' && ID.test(String(data.id)) && NAME.test(String(data.name))) {
    const peers = Array.isArray(data.peers) ? data.peers.map((p) => readPeer(p, knownMap)).filter(Boolean) : [];
    return { t: 'hello', id: data.id, name: data.name, peers };
  }
  if (data?.t === 'pos') {
    const peer = readPeer(data, knownMap);
    return peer && { t: 'pos', ...peer };
  }
  if (data?.t === 'gone' && ID.test(String(data.id))) return { t: 'gone', id: data.id };
  if (data?.t === 'emote' && ID.test(String(data.id)) && typeof data.e === 'string') return { t: 'emote', id: data.id, e: data.e };
  return null;
}

function readPeer(p, knownMap) {
  if (!p || !ID.test(String(p.id)) || !NAME.test(String(p.name))) return null;
  if (!knownMap(p.map) || !coord(p.x) || !coord(p.y)) return null;
  return { id: p.id, name: p.name, map: p.map, x: p.x, y: p.y };
}

// enabled: ob Echos heute an sind. getPosition(): { map, x, y } des Spielers. knownMap(id): gibt es die Karte?
// onChange(): neu zeichnen. onEmote(peer, emote): jemand auf derselben Karte hat eine Geste gemacht.
// Gibt { moved, emote, here, total, bubbleOf } zurück; bei ausgeschalteten Echos tun alle nichts.
export function setupPresence({ archived, enabled, emotes, getPosition, knownMap, onChange, onEmote }) {
  const idle = { moved() {}, emote() {}, here: () => [], total: () => 0, bubbleOf: () => null, active: false };
  if (archived || !enabled || !SUGGEST_URL) return idle;

  const peers = new Map();
  const bubbles = new Map();
  let ws = null;
  let ready = false;
  let retry = null;
  let backoff = 3000;
  let hiddenTimer = null;
  let lastSent = 0;
  let sendTimer = null;
  let sentKey = '';

  const sendPosition = () => {
    clearTimeout(sendTimer);
    sendTimer = null;
    if (!ready) return;
    const { map, x, y } = getPosition();
    const key = `${map}:${x}:${y}`;
    if (key === sentKey) return;
    sentKey = key;
    lastSent = Date.now();
    ws.send(JSON.stringify({ t: 'pos', map, x, y }));
  };

  // Höchstens alle SEND_GAP_MS eine Position; die letzte geht immer noch hinterher.
  function moved() {
    if (!ready || sendTimer) return;
    const wait = SEND_GAP_MS - (Date.now() - lastSent);
    if (wait <= 0) sendPosition();
    else sendTimer = setTimeout(sendPosition, wait);
  }

  function emote(id) {
    if (!ready || !emotes.some((e) => e.id === id)) return false;
    ws.send(JSON.stringify({ t: 'emote', e: id }));
    return true;
  }

  function connect() {
    clearTimeout(retry);
    const url = new URL('presence', SUGGEST_URL);
    url.protocol = 'wss:';
    const socket = new WebSocket(url);
    ws = socket;
    socket.addEventListener('message', (event) => {
      if (ws !== socket) return;
      const data = readMessage(event.data, knownMap);
      if (!data) return;
      if (data.t === 'hello') {
        ready = true;
        backoff = 3000;
        peers.clear();
        for (const peer of data.peers) peers.set(peer.id, peer);
        sentKey = '';
        sendPosition();
      } else if (data.t === 'pos') {
        peers.set(data.id, { ...peers.get(data.id), ...data });
      } else if (data.t === 'gone') {
        peers.delete(data.id);
        bubbles.delete(data.id);
      } else if (data.t === 'emote') {
        const peer = peers.get(data.id);
        const kind = emotes.find((e) => e.id === data.e);
        if (!peer || !kind || peer.map !== getPosition().map) return;
        bubbles.set(peer.id, { text: kind.bubble, until: Date.now() + BUBBLE_MS });
        setTimeout(onChange, BUBBLE_MS + 50);
        onEmote(peer, kind);
      }
      onChange();
    });
    socket.addEventListener('close', () => {
      if (ws !== socket) return;
      ws = null;
      ready = false;
      peers.clear();
      onChange();
      if (document.hidden) return;
      retry = setTimeout(connect, backoff);
      backoff = Math.min(backoff * 2, 60_000);
    });
  }

  function disconnect() {
    clearTimeout(retry);
    const socket = ws;
    ws = null;
    ready = false;
    peers.clear();
    socket?.close();
    onChange();
  }

  // Wer den Tab lange im Hintergrund hat, verschwindet aus der Welt und kommt beim Zurückkehren wieder.
  document.addEventListener('visibilitychange', () => {
    clearTimeout(hiddenTimer);
    if (document.hidden) hiddenTimer = setTimeout(disconnect, HIDDEN_CLOSE_MS);
    else if (!ws) connect();
  });
  connect();

  const here = () => {
    const map = getPosition().map;
    return [...peers.values()].filter((p) => p.map === map);
  };
  const bubbleOf = (id) => {
    const bubble = bubbles.get(id);
    if (!bubble || bubble.until < Date.now()) return null;
    return bubble.text;
  };
  return { moved, emote, here, total: () => peers.size, bubbleOf, active: true };
}
