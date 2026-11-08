// Echos und gemeinsame Welt. Geschützte Datei: Netzwerkzugriff wie chat.js.
// Das Spiel meldet dem Worker die eigene Position (Karte, x, y), Treffer
// auf Kreaturen ({ t: 'hit', id, dmg }) und Besucher vom Glücksrad ({ t: 'summon', type, x, y }).
// Zurück kommen Positionen der anderen mit ihren anonymen Tagesnamen, der Stand der Kreaturen
// der eigenen Karte ('world'), Bisse ('bite') und gemeinsame Siege ('slain'). Kein Freitext.
// Alles kommt als Text ins DOM (textContent), nie als HTML.
import { SUGGEST_URL } from './config.js';

const SEND_GAP_MS = 150;
const HIDDEN_CLOSE_MS = 60_000;
const NAME = /^[a-z]+-[0-9a-f]{3}$/;
const ID = /^[0-9a-f]{1,12}$/;
const CREATURE_ID = /^c\d{1,6}$/;
const KIND = /^[a-z0-9-]{1,32}$/;
const coord = (v) => Number.isInteger(v) && v >= 0 && v <= 255;
const OUTGOING = new Set(['hit', 'summon']);

function readCreature(c) {
  if (!c || !CREATURE_ID.test(String(c.id)) || !KIND.test(String(c.type))) return null;
  if (!coord(c.x) || !coord(c.y) || !Number.isInteger(c.hp)) return null;
  return { id: c.id, type: c.type, x: c.x, y: c.y, hp: c.hp };
}

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
  if (data?.t === 'world' && KIND.test(String(data.map))) {
    if (data.creatures === null) return { t: 'world', map: data.map, creatures: null };
    if (!Array.isArray(data.creatures)) return null;
    return { t: 'world', map: data.map, creatures: data.creatures.map(readCreature).filter(Boolean) };
  }
  if (data?.t === 'bite' && KIND.test(String(data.type))) return { t: 'bite', type: data.type };
  if (data?.t === 'slain' && CREATURE_ID.test(String(data.id)) && KIND.test(String(data.type)) && Array.isArray(data.by)) {
    const by = data.by.filter((p) => ID.test(String(p?.id)) && NAME.test(String(p?.name))).map((p) => ({ id: p.id, name: p.name }));
    return { t: 'slain', id: data.id, type: data.type, by };
  }
  return null;
}

function readPeer(p, knownMap) {
  if (!p || !ID.test(String(p.id)) || !NAME.test(String(p.name))) return null;
  if (!knownMap(p.map) || !coord(p.x) || !coord(p.y)) return null;
  return { id: p.id, name: p.name, map: p.map, x: p.x, y: p.y };
}

// enabled: ob Echos heute an sind. getPosition(): { map, x, y } des Spielers. knownMap(id): gibt es die Karte?
// onChange(): neu zeichnen.
// onWorld(map, creatures | null), onBite(type), onSlain(type, by, mine), onLost(): gemeinsame Welt.
// Gibt { moved, send, myId, here, total } zurück; bei ausgeschalteten Echos tun alle nichts.
export function setupPresence({
  archived, enabled, getPosition, knownMap, onChange,
  onWorld = () => {}, onBite = () => {}, onSlain = () => {}, onLost = () => {},
}) {
  const idle = { moved() {}, send() {}, myId: () => null, here: () => [], total: () => 0, active: false };
  if (archived || !enabled || !SUGGEST_URL) return idle;

  const peers = new Map();
  let ws = null;
  let ready = false;
  let retry = null;
  let backoff = 3000;
  let hiddenTimer = null;
  let lastSent = 0;
  let sendTimer = null;
  let sentKey = '';
  let myId = null;

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

  // Treffer und Besucher aus state.outbox. Nur bekannte Arten gehen raus.
  function send(messages) {
    if (!ready) return;
    sendPosition();
    for (const message of messages) if (OUTGOING.has(message?.t)) ws.send(JSON.stringify(message));
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
        myId = data.id;
        backoff = 3000;
        peers.clear();
        for (const peer of data.peers) peers.set(peer.id, peer);
        sentKey = '';
        sendPosition();
      } else if (data.t === 'pos') {
        peers.set(data.id, { ...peers.get(data.id), ...data });
      } else if (data.t === 'gone') {
        peers.delete(data.id);
      } else if (data.t === 'world') {
        if (data.map === getPosition().map) onWorld(data.map, data.creatures);
        return;
      } else if (data.t === 'bite') {
        onBite(data.type);
        return;
      } else if (data.t === 'slain') {
        onSlain(data.type, data.by, data.by.some((p) => p.id === myId));
        return;
      }
      onChange();
    });
    socket.addEventListener('close', () => {
      if (ws !== socket) return;
      ws = null;
      ready = false;
      peers.clear();
      onLost();
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
    onLost();
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
  return { moved, send, myId: () => myId, here, total: () => peers.size, active: true };
}
