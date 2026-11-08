// Echos im Worker: Positionen, Gesten, Grenzen gegen Missbrauch. Speicher und WebSockets sind nachgebaut.
import { expect, test } from '@playwright/test';
import worker from '../../worker/index.js';
import {
  PresenceRoom, parseMessage, takeToken, BUCKET_SIZE, MAX_PER_PERSON, MAX_STRIKES,
} from '../../worker/presence.js';

const ORIGIN = 'https://poffel5657.github.io';

class FakeSocket {
  constructor() { this.inbox = []; this.attachment = null; this.closed = null; }
  send(data) { this.inbox.push(JSON.parse(data)); }
  serializeAttachment(value) { this.attachment = structuredClone(value); }
  deserializeAttachment() { return structuredClone(this.attachment); }
  close(code) { this.closed = code; }
}

const makeRoom = () => {
  let sockets = [];
  const ctx = {
    acceptWebSocket: (ws) => sockets.push(ws),
    getWebSockets: () => sockets,
  };
  const room = new PresenceRoom(ctx, {});
  return { room, sockets: () => sockets, remove: (ws) => { sockets = sockets.filter((s) => s !== ws); } };
};

globalThis.WebSocketPair = class {
  constructor() { const socket = new FakeSocket(); this[0] = socket; this[1] = socket; }
};
const OriginalResponse = globalThis.Response;
const connect = async (room, fp) => {
  globalThis.Response = class { constructor(body, init) { this.status = init?.status; this.webSocket = init?.webSocket; } };
  try {
    return await room.fetch(new Request('https://presence/', { headers: { 'X-Presence-Fp': fp } }));
  } finally {
    globalThis.Response = OriginalResponse;
  }
};
const say = (room, ws, data) => room.webSocketMessage(ws, JSON.stringify(data));

const FP_A = 'a'.repeat(64);
const FP_B = 'b'.repeat(64);

test('Nachrichten werden streng geprüft', () => {
  expect(parseMessage('{"t":"pos","map":"meadow","x":3,"y":4}')).toEqual({ t: 'pos', map: 'meadow', x: 3, y: 4 });
  expect(parseMessage('{"t":"pos","map":"Meadow!","x":3,"y":4}')).toBeNull();
  expect(parseMessage('{"t":"pos","map":"meadow","x":-1,"y":4}')).toBeNull();
  expect(parseMessage('{"t":"pos","map":"meadow","x":1.5,"y":4}')).toBeNull();
  expect(parseMessage('{"t":"pos","map":"meadow","x":3,"y":9999}')).toBeNull();
  expect(parseMessage('{"t":"emote","e":"wave"}')).toEqual({ t: 'emote', e: 'wave' });
  expect(parseMessage('{"t":"emote","e":"hello mom"}')).toBeNull();
  expect(parseMessage('{"t":"say","text":"hi"}')).toBeNull();
  expect(parseMessage('kaputt')).toBeNull();
});

test('Eimer: erst BUCKET_SIZE auf einmal, dann nur noch nachgefüllt', () => {
  let bucket = { tokens: BUCKET_SIZE, at: 0 };
  for (let i = 0; i < BUCKET_SIZE; i += 1) {
    const r = takeToken(bucket, 0);
    expect(r.ok).toBe(true);
    bucket = r.bucket;
  }
  expect(takeToken(bucket, 0).ok).toBe(false);
  expect(takeToken(bucket, 1000).ok).toBe(true);
});

test('Zwei Spieler sehen einander, Gesten kommen an, Weggehen wird gemeldet', async () => {
  const { room, sockets, remove } = makeRoom();
  const a = (await connect(room, FP_A)).webSocket;
  expect(a.inbox[0]).toMatchObject({ t: 'hello', peers: [] });
  expect(a.inbox[0].name).toMatch(/^[a-z]+-aaa$/);
  await say(room, a, { t: 'pos', map: 'meadow', x: 5, y: 6 });
  // Gesten vor der ersten Position gehen nicht raus, danach schon.
  const b = (await connect(room, FP_B)).webSocket;
  expect(b.inbox[0].peers).toEqual([{ id: a.inbox[0].id, name: a.inbox[0].name, map: 'meadow', x: 5, y: 6 }]);
  await say(room, b, { t: 'emote', e: 'wave' });
  expect(a.inbox.filter((m) => m.t === 'emote')).toEqual([]);
  await say(room, b, { t: 'pos', map: 'meadow', x: 7, y: 6 });
  expect(a.inbox.at(-1)).toMatchObject({ t: 'pos', id: b.inbox[0].id, x: 7, y: 6 });
  // Der Sender bekommt sein eigenes Echo nicht zurück.
  expect(b.inbox.filter((m) => m.t === 'pos')).toEqual([]);
  await say(room, b, { t: 'emote', e: 'wave' });
  expect(a.inbox.at(-1)).toEqual({ t: 'emote', id: b.inbox[0].id, e: 'wave' });
  // Der Fingerabdruck verlässt den Raum nie.
  expect(JSON.stringify(a.inbox)).not.toContain('bbbb');
  expect(sockets()).toHaveLength(2);
  remove(b);
  await room.webSocketClose(b, 1005);
  expect(a.inbox.at(-1)).toEqual({ t: 'gone', id: b.inbox[0].id });
});

test('Grenzen: Verbindungen pro Person, ungültiger Kopf, Flut', async () => {
  const { room } = makeRoom();
  expect((await connect(room, 'nope')).status).toBe(400);
  for (let i = 0; i < MAX_PER_PERSON; i += 1) expect((await connect(room, FP_A)).status).toBe(101);
  expect((await connect(room, FP_A)).status).toBe(429);
  const b = (await connect(room, FP_B)).webSocket;
  for (let i = 0; i < BUCKET_SIZE + MAX_STRIKES; i += 1) await say(room, b, { t: 'pos', map: 'meadow', x: 1, y: i % 200 });
  expect(b.closed).toBe(1008);
});

test('Worker: nur von der eigenen Seite, nur als WebSocket, Fingerabdruck statt IP', async () => {
  let seen = null;
  const env = {
    IP_HASH_SECRET: 'test-secret',
    PRESENCE: {
      idFromName: (name) => name,
      get: () => ({ fetch: async (request) => { seen = request.headers.get('X-Presence-Fp'); return new Response('ok'); } }),
    },
  };
  const call = (headers) => worker.fetch(new Request('https://worker.test/presence', { headers }), env);
  expect((await call({ Origin: 'https://evil.test', Upgrade: 'websocket' })).status).toBe(403);
  expect((await call({ Origin: ORIGIN })).status).toBe(426);
  expect((await call({ Origin: ORIGIN, Upgrade: 'websocket', 'CF-Connecting-IP': '203.0.113.7', 'X-Presence-Fp': 'f'.repeat(64) })).status).toBe(200);
  expect(seen).toMatch(/^[0-9a-f]{64}$/);
  expect(seen).not.toBe('f'.repeat(64));
});
