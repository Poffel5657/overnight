// Echos: Spieler sehen einander in der Welt. Ein Raum als Durable Object, WebSocket mit Hibernation-API.
// Es laufen nur Positionen und Gesten aus einer festen Liste, nie Freitext. Namen vergibt der Server aus
// dem Tages-Fingerabdruck (dieselben anonymen Namen wie im Chat), niemand wählt seinen eigenen.
// Gespeichert wird nichts: Alles, was der Raum wissen muss, hängt als Attachment am jeweiligen Socket.
//
// Gemeinsame Welt (seit Tag 6): Der Raum führt pro Karte, auf der jemand steht, eine Welt aus src/game.js
// (createWorld) und rechnet sie alle PRESENCE.tickMs mit stepWorld (Alarm). Kreaturen, Treffer und Siege
// sind damit für alle gleich. Fortschritt (HP, Beutel, Erfahrung) bleibt im Browser des Spielers.
// Die Welten liegen nur im Speicher: Wird das Objekt neu gestartet, erscheinen die Kreaturen frisch.
import { nameFor } from './chat.js';
import { createWorld, hitWorld, stepWorld, summonWorld } from '../src/game.js';
import { MAPS } from '../content/world.js';
import { PRESENCE } from '../content/presence.js';

export const MAX_SOCKETS = 200;
export const MAX_PER_PERSON = 3;
// Token-Bucket pro Verbindung: so viele Nachrichten auf einmal, danach BUCKET_RATE pro Sekunde.
export const BUCKET_SIZE = 30;
export const BUCKET_RATE = 15;
// Wer das Limit so oft hintereinander reißt, fliegt raus.
export const MAX_STRIKES = 50;
export const TICK_MS = Math.max(300, PRESENCE.tickMs ?? 700);
// Eine leere Karte bleibt so lange bestehen, damit kurzes Hin und Her die Kreaturen nicht neu setzt.
export const EMPTY_KEEP_MS = 60_000;
export const SUMMON_GAP_MS = 20_000;
const CREATURE_ID = /^c\d{1,6}$/;
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
  if (data?.t === 'hit' && CREATURE_ID.test(String(data.id)) && Number.isInteger(data.dmg) && data.dmg >= 1 && data.dmg <= 99) {
    return { t: 'hit', id: data.id, dmg: data.dmg };
  }
  if (data?.t === 'summon' && MAP_PATTERN.test(String(data.type)) && coord(data.x) && coord(data.y)) {
    return { t: 'summon', type: data.type, x: data.x, y: data.y };
  }
  return null;
}

// Füllt den Eimer seit dem letzten Mal auf und nimmt eine Marke heraus, wenn eine da ist.
export function takeToken(bucket, now) {
  const tokens = Math.min(BUCKET_SIZE, bucket.tokens + ((now - bucket.at) / 1000) * BUCKET_RATE);
  if (tokens < 1) return { ok: false, bucket: { tokens, at: now } };
  return { ok: true, bucket: { tokens: tokens - 1, at: now } };
}

const peerOf = ({ id, name, map, x, y }) => ({ id, name, map, x, y });
const snapshotOf = (world) => world.creatures
  .filter((c) => c.respawnAt === null)
  .map(({ id, type, x, y, hp }) => ({ id, type, x, y, hp }));

export class PresenceRoom {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
    // map -> { world, emptySince, last } (last: zuletzt gesendeter Stand als Text)
    this.worlds = new Map();
  }

  // Welt einer Karte, bei Bedarf neu. null, wenn diese Version des Servers die Karte nicht kennt.
  worldFor(map) {
    if (!Object.hasOwn(MAPS, map)) return null;
    let entry = this.worlds.get(map);
    if (!entry) {
      entry = { world: createWorld(map, Math.floor(Math.random() * 2 ** 31)), emptySince: null, last: '' };
      this.worlds.set(map, entry);
    }
    return entry;
  }

  sendTo(ws, data) {
    try {
      ws.send(JSON.stringify(data));
    } catch {
      // Verbindung ist schon weg.
    }
  }

  // Schickt allen auf der Karte den aktuellen Stand (force: auch wenn sich nichts geändert hat).
  sendWorld(map, force = false) {
    const entry = this.worlds.get(map);
    if (!entry) return;
    const payload = JSON.stringify({ t: 'world', map, turn: entry.world.turn, creatures: snapshotOf(entry.world) });
    if (!force && payload === entry.last) return;
    entry.last = payload;
    for (const { ws, info } of this.peers()) {
      if (info.map !== map) continue;
      try {
        ws.send(payload);
      } catch {
        // weg
      }
    }
  }

  async ensureTicking() {
    if ((await this.ctx.storage.getAlarm()) === null) await this.ctx.storage.setAlarm(Date.now() + TICK_MS);
  }

  // Ein Takt für alle Karten. Läuft nur, solange jemand in der Welt steht.
  async alarm() {
    const now = Date.now();
    const peers = this.peers().filter(({ info }) => info.map);
    const byMap = new Map();
    for (const peer of peers) {
      if (!byMap.has(peer.info.map)) byMap.set(peer.info.map, []);
      byMap.get(peer.info.map).push(peer);
    }
    for (const map of byMap.keys()) this.worldFor(map);
    for (const [map, entry] of this.worlds) {
      const here = byMap.get(map) ?? [];
      if (!here.length) {
        entry.emptySince ??= now;
        if (now - entry.emptySince > EMPTY_KEEP_MS) this.worlds.delete(map);
        continue;
      }
      entry.emptySince = null;
      const bites = stepWorld(entry.world, here.map(({ info }) => ({ id: info.id, x: info.x, y: info.y })));
      for (const bite of bites) {
        const target = here.find(({ info }) => info.id === bite.id);
        if (target) this.sendTo(target.ws, { t: 'bite', type: bite.type });
      }
      this.sendWorld(map);
    }
    if (peers.length || this.worlds.size) await this.ctx.storage.setAlarm(Date.now() + TICK_MS);
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
      summonAt: 0,
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
    info.strikes = 0;
    const message = parseMessage(raw);
    if (!message) {
      ws.serializeAttachment(info);
      return;
    }
    if (message.t === 'pos') {
      const changedMap = info.map !== message.map;
      info.map = message.map;
      info.x = message.x;
      info.y = message.y;
      ws.serializeAttachment(info);
      this.broadcast({ t: 'pos', ...peerOf(info) }, ws);
      if (changedMap) {
        // Neue Karte: sofort ihren Stand schicken, damit niemand in eine leere Welt läuft.
        const entry = this.worldFor(info.map);
        if (!entry) this.sendTo(ws, { t: 'world', map: info.map, creatures: null });
        else this.sendTo(ws, { t: 'world', map: info.map, turn: entry.world.turn, creatures: snapshotOf(entry.world) });
        await this.ensureTicking();
      }
      return;
    }
    ws.serializeAttachment(info);
    if (message.t === 'hit' && info.map) {
      const entry = this.worlds.get(info.map);
      const result = entry && hitWorld(entry.world, message.id, message.dmg, { id: info.id, x: info.x, y: info.y });
      if (!result) return;
      if (result.killed) {
        const names = Object.fromEntries(this.peers().map(({ info: p }) => [p.id, p.name]));
        const by = result.hitters.filter((id) => names[id]).map((id) => ({ id, name: names[id] }));
        for (const { ws: other, info: p } of this.peers()) {
          if (p.map === info.map) this.sendTo(other, { t: 'slain', id: message.id, type: result.type, by });
        }
      }
      this.sendWorld(info.map);
      return;
    }
    if (message.t === 'summon' && info.map) {
      const entry = this.worlds.get(info.map);
      if (!entry || Date.now() - info.summonAt < SUMMON_GAP_MS) return;
      if (!summonWorld(entry.world, message.type, message.x, message.y)) return;
      info.summonAt = Date.now();
      ws.serializeAttachment(info);
      this.sendWorld(info.map);
      return;
    }
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
