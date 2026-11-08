// Echos im Worker: Positionen, Gesten, Grenzen gegen Missbrauch. Speicher und WebSockets sind nachgebaut.
import { expect, test } from '@playwright/test';
import worker from '../../worker/index.js';
import {
  PresenceRoom, parseMessage, takeToken, BUCKET_SIZE, MAX_PER_PERSON, MAX_STRIKES,
} from '../../worker/presence.js';
import { MAPS } from '../../content/world.js';
import { CREATURES } from '../../content/creatures.js';

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
  let alarmAt = null;
  const ctx = {
    acceptWebSocket: (ws) => sockets.push(ws),
    getWebSockets: () => sockets,
    storage: { getAlarm: async () => alarmAt, setAlarm: async (at) => { alarmAt = at; } },
  };
  const room = new PresenceRoom(ctx, {});
  return {
    room, sockets: () => sockets, alarm: () => alarmAt, remove: (ws) => { sockets = sockets.filter((s) => s !== ws); },
  };
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
  expect(parseMessage('{"t":"hit","id":"c3","dmg":2}')).toEqual({ t: 'hit', id: 'c3', dmg: 2 });
  expect(parseMessage('{"t":"hit","id":"c3","dmg":500}')).toBeNull();
  expect(parseMessage('{"t":"hit","id":"x3","dmg":2}')).toBeNull();
  expect(parseMessage('{"t":"summon","type":"frog","x":1,"y":2}')).toEqual({ t: 'summon', type: 'frog', x: 1, y: 2 });
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
  expect(a.inbox.filter((m) => m.t === 'pos').at(-1)).toMatchObject({ t: 'pos', id: b.inbox[0].id, x: 7, y: 6 });
  // Der Sender bekommt sein eigenes Echo nicht zurück, aber den Stand der Karte.
  expect(b.inbox.filter((m) => m.t === 'pos')).toEqual([]);
  expect(b.inbox.find((m) => m.t === 'world')).toMatchObject({ t: 'world', map: 'meadow' });
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

// Freies Nachbarfeld neben einer Kreatur suchen, damit ein Spieler sie treffen kann.
const besides = (c) => [[1, 0], [-1, 0], [0, 1], [0, -1]]
  .map(([dx, dy]) => ({ x: c.x + dx, y: c.y + dy }))
  .find(({ x, y }) => MAPS.meadow.tiles[y]?.[x] && !MAPS.meadow.entities.some((e) => e.x === x && e.y === y));

test('Gemeinsame Welt: alle sehen dieselben Kreaturen, Siege gehören allen, die mitgekämpft haben', async () => {
  const { room, alarm } = makeRoom();
  const a = (await connect(room, FP_A)).webSocket;
  const b = (await connect(room, FP_B)).webSocket;
  await say(room, a, { t: 'pos', map: 'meadow', x: 1, y: 1 });
  await say(room, b, { t: 'pos', map: 'meadow', x: 1, y: 2 });
  expect(alarm()).not.toBeNull();
  const worldA = a.inbox.find((m) => m.t === 'world');
  const worldB = b.inbox.find((m) => m.t === 'world');
  expect(worldA.creatures.length).toBe(MAPS.meadow.spawns.length);
  expect(worldB.creatures).toEqual(worldA.creatures);

  // Ein paar Takte: beide bekommen denselben Stand.
  for (let i = 0; i < 5; i += 1) await room.alarm();
  const lastA = a.inbox.filter((m) => m.t === 'world').at(-1);
  const lastB = b.inbox.filter((m) => m.t === 'world').at(-1);
  expect(lastA).toEqual(lastB);

  // Beide stellen sich neben die erste Kreatur und schlagen zu, bis sie fällt.
  const target = lastA.creatures[0];
  const spot = besides(target);
  await say(room, a, { t: 'pos', map: 'meadow', ...spot });
  await say(room, b, { t: 'pos', map: 'meadow', ...spot });
  // Schlag von weit weg zählt nicht.
  await say(room, a, { t: 'hit', id: 'c999', dmg: 1 });
  const hp = CREATURES[target.type].hp;
  await say(room, a, { t: 'hit', id: target.id, dmg: 1 });
  await say(room, b, { t: 'hit', id: target.id, dmg: hp });
  const slainA = a.inbox.find((m) => m.t === 'slain');
  expect(slainA).toMatchObject({ id: target.id, type: target.type });
  expect(slainA.by.map((p) => p.id).sort()).toEqual([a.inbox[0].id, b.inbox[0].id].sort());
  expect(b.inbox.find((m) => m.t === 'slain')).toEqual(slainA);
  expect(a.inbox.filter((m) => m.t === 'world').at(-1).creatures.some((c) => c.id === target.id)).toBe(false);
  // Noch ein Schlag auf die Besiegte: nichts passiert.
  await say(room, a, { t: 'hit', id: target.id, dmg: 1 });
  expect(a.inbox.filter((m) => m.t === 'slain')).toHaveLength(1);
});

test('Gemeinsame Welt: Kreaturen beißen den, der daneben steht; unbekannte Karte bleibt solo', async () => {
  const { room } = makeRoom();
  const a = (await connect(room, FP_A)).webSocket;
  await say(room, a, { t: 'pos', map: 'meadow', x: 1, y: 1 });
  const rat = a.inbox.find((m) => m.t === 'world').creatures.find((c) => CREATURES[c.type].ai === 'skulk');
  const spot = besides(rat);
  await say(room, a, { t: 'pos', map: 'meadow', ...spot });
  let bites = 0;
  for (let i = 0; i < 40 && !bites; i += 1) {
    await room.alarm();
    bites = a.inbox.filter((m) => m.t === 'bite').length;
  }
  expect(bites).toBeGreaterThan(0);
  expect(a.inbox.find((m) => m.t === 'bite').type).toBe(rat.type);

  await say(room, a, { t: 'pos', map: 'not-a-real-map', x: 1, y: 1 });
  expect(a.inbox.at(-1)).toEqual({ t: 'world', map: 'not-a-real-map', creatures: null });
});

test('Gemeinsame Welt: nur Besucher, die das Rad bringt, und nicht zu oft', async () => {
  const { room } = makeRoom();
  const a = (await connect(room, FP_A)).webSocket;
  await say(room, a, { t: 'pos', map: 'meadow', x: 1, y: 1 });
  const count = () => a.inbox.filter((m) => m.t === 'world').at(-1).creatures.length;
  const before = count();
  const free = [[2, 2], [3, 2], [2, 3], [4, 4], [5, 5], [6, 6]].map(([x, y]) => ({ x, y }))
    .filter(({ x, y }) => MAPS.meadow.tiles[y]?.[x] === '.');
  await say(room, a, { t: 'summon', type: 'crumb-heap', ...free[0] });
  expect(count()).toBe(before);
  await say(room, a, { t: 'summon', type: 'frog', ...free[0] });
  expect(count()).toBe(before + 1);
  await say(room, a, { t: 'summon', type: 'frog', ...free[1] });
  expect(count()).toBe(before + 1);
});
