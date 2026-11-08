// Echos: Spieler sehen einander in der Welt. Ein Raum als Durable Object, WebSocket mit Hibernation-API.
// Es laufen nur Positionen und Gesten aus einer festen Liste, nie Freitext. Namen vergibt der Server aus
// dem Tages-Fingerabdruck (dieselben anonymen Namen wie im Chat), niemand wählt seinen eigenen.
// Gespeichert wird nichts: Alles, was der Raum wissen muss, hängt als Attachment am jeweiligen Socket.
import { nameFor } from './chat.js';

export const MAX_SOCKETS = 200;
export const MAX_PER_PERSON = 3;
// Token-Bucket pro Verbindung: so viele Nachrichten auf einmal, danach BUCKET_RATE pro Sekunde.
export const BUCKET_SIZE = 20;
export const BUCKET_RATE = 8;
// Wer das Limit trotzdem dauernd reißt, fliegt raus.
export const MAX_STRIKES = 50;
export const EMOTES = ['wave', 'cheer', 'bow', 'help'];
const MAP_PATTERN = /^[a-z0-9-]{1,32}$/;
const MAX_COORD = 255;

const coord = (value) => Number.isInteger(value) && value >= 0 && value <= MAX_COORD;

// Prüft eine Nachricht vom Spiel. Gibt eine bereinigte Form zurück oder null.
export function parseMessage(raw) {
  let data;
  try {
    data = JSON.parse(typeof raw === 'string' ? raw : new TextDecoder().decode(raw));
  } catch {
    return null;
  }
  if (data?.t === 'pos' && MAP_PATTERN.test(String(data.map)) && coord(data.x) && coord(data.y)) {
    return { t: 'pos', map: data.map, x: data.x, y: data.y };
  }
  if (data?.t === 'emote' && EMOTES.includes(data.e)) return { t: 'emote', e: data.e };
  return null;
}

// Füllt den Eimer seit dem letzten Mal auf und nimmt eine Marke heraus, wenn eine da ist.
export function takeToken(bucket, now) {
  const tokens = Math.min(BUCKET_SIZE, bucket.tokens + ((now - bucket.at) / 1000) * BUCKET_RATE);
  if (tokens < 1) return { ok: false, bucket: { tokens, at: now } };
  return { ok: true, bucket: { tokens: tokens - 1, at: now } };
}

const peerOf = ({ id, name, map, x, y }) => ({ id, name, map, x, y });

export class PresenceRoom {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
  }

  // Alle Verbindungen mit ihrem Attachment. Kaputte Sockets überspringen.
  peers() {
    const list = [];
    for (const ws of this.ctx.getWebSockets()) {
      try {
        const info = ws.deserializeAttachment();
        if (info) list.push({ ws, info });
      } catch {
        // Socket ist schon weg.
      }
    }
    return list;
  }

  broadcast(data, except = null) {
    const payload = JSON.stringify(data);
    for (const { ws } of this.peers()) {
      if (ws === except) continue;
      try {
        ws.send(payload);
      } catch {
        // Verbindung ist schon weg.
      }
    }
  }

  async fetch(request) {
    const fp = request.headers.get('X-Presence-Fp') ?? '';
    if (!/^[0-9a-f]{64}$/.test(fp)) return new Response(null, { status: 400 });
    const peers = this.peers();
    if (peers.length >= MAX_SOCKETS) return new Response(null, { status: 503 });
    if (peers.filter(({ info }) => info.fp === fp).length >= MAX_PER_PERSON) return new Response(null, { status: 429 });

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    const info = {
      id: crypto.randomUUID().slice(0, 8),
      fp,
      name: nameFor(fp),
      map: null,
      x: 0,
      y: 0,
      bucket: { tokens: BUCKET_SIZE, at: Date.now() },
      strikes: 0,
    };
    server.serializeAttachment(info);
    // Wer gerade wo steht. Wer noch keine Position gemeldet hat, ist noch nicht in der Welt.
    const others = peers.filter(({ info: other }) => other.map).map(({ info: other }) => peerOf(other));
    server.send(JSON.stringify({ t: 'hello', id: info.id, name: info.name, peers: others }));
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, raw) {
    const info = ws.deserializeAttachment();
    if (!info) return;
    const rate = takeToken(info.bucket, Date.now());
    info.bucket = rate.bucket;
    if (!rate.ok) {
      info.strikes += 1;
      ws.serializeAttachment(info);
      if (info.strikes >= MAX_STRIKES) this.drop(ws, info, 1008, 'too fast');
      return;
    }
    const message = parseMessage(raw);
    if (!message) {
      ws.serializeAttachment(info);
      return;
    }
    if (message.t === 'pos') {
      info.map = message.map;
      info.x = message.x;
      info.y = message.y;
      ws.serializeAttachment(info);
      this.broadcast({ t: 'pos', ...peerOf(info) }, ws);
      return;
    }
    ws.serializeAttachment(info);
    // Gesten nur, wenn man schon irgendwo steht.
    if (message.t === 'emote' && info.map) this.broadcast({ t: 'emote', id: info.id, e: message.e }, ws);
  }

  drop(ws, info, code, reason) {
    try {
      ws.close(code, reason);
    } catch {
      // schon zu
    }
    if (info?.map) this.broadcast({ t: 'gone', id: info.id }, ws);
  }

  async webSocketClose(ws, code) {
    let info = null;
    try {
      info = ws.deserializeAttachment();
    } catch {
      // egal
    }
    this.drop(ws, info, code === 1005 || code === 1006 ? 1000 : code, 'bye');
  }

  async webSocketError(ws) {
    await this.webSocketClose(ws, 1011);
  }
}
