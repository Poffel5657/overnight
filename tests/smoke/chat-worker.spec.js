// Chat im Worker: Filter, Rate-Limit, Melden, Moderation und Tickets. Speicher und WebSockets sind nachgebaut.
import { expect, test } from '@playwright/test';
import worker from '../../worker/index.js';
import { ChatRoom, checkText, nameFor, rateCheck, REPORTS_TO_HIDE } from '../../worker/chat.js';

const ORIGIN = 'https://poffel5657.github.io';

// Nachgebautes WebSocket-Paar: Was der Server sendet, landet in client.inbox.
class FakeSocket {
  constructor() { this.inbox = []; this.attachment = null; }
  send(data) { this.inbox.push(JSON.parse(data)); }
  serializeAttachment(value) { this.attachment = value; }
  deserializeAttachment() { return this.attachment; }
  close() {}
}

const makeRoom = () => {
  const store = new Map();
  const sockets = [];
  const ctx = {
    storage: {
      get: async (key) => structuredClone(store.get(key)),
      put: async (key, value) => { store.set(key, structuredClone(value)); },
    },
    acceptWebSocket: (ws) => sockets.push(ws),
    getWebSockets: () => sockets,
  };
  return { room: new ChatRoom(ctx, {}), sockets, store };
};

globalThis.WebSocketPair = class {
  constructor() { const socket = new FakeSocket(); this[0] = socket; this[1] = socket; }
};
const OriginalResponse = globalThis.Response;
// Node kennt Status 101 mit webSocket nicht; für die Tests reicht ein einfaches Objekt.
const connect = async (room, fp = '') => {
  globalThis.Response = class { constructor(body, init) { this.status = init?.status; this.webSocket = init?.webSocket; } };
  try {
    await room.fetch(new Request('https://chat/', { headers: { 'X-Chat-Fp': fp } }));
  } finally {
    globalThis.Response = OriginalResponse;
  }
};

const FP_A = 'a'.repeat(64);
const FP_B = 'b'.repeat(64);
const FP_C = 'c'.repeat(64);
const FP_D = 'd'.repeat(64);

test('Wortfilter, Links und Länge', () => {
  expect(checkText('  hello   there  ')).toEqual({ text: 'hello there' });
  expect(checkText('')).toHaveProperty('error');
  expect(checkText('x'.repeat(201))).toHaveProperty('error');
  expect(checkText('go to www.example.com')).toHaveProperty('error');
  expect(checkText('join discord.gg/abc')).toHaveProperty('error');
  expect(checkText('you are a sh1t')).toHaveProperty('error');
  expect(checkText('FUUUUCK')).toHaveProperty('error');
  // Harmlose Wörter mit ähnlichen Anfängen bleiben erlaubt.
  expect(checkText('the cockpit of the dicke boat in essex')).toEqual({ text: 'the cockpit of the dicke boat in essex' });
  expect(checkText('Goodnight, Nightwright! See you tonight.')).toHaveProperty('text');
  expect(checkText('Assassin of the grass glass')).toHaveProperty('text');
});

test('Rate-Limit: Abstand und Stundengrenze', () => {
  const now = 10_000_000;
  expect(rateCheck([], now).ok).toBe(true);
  expect(rateCheck([now - 1000], now).ok).toBe(false);
  expect(rateCheck([now - 6000], now).ok).toBe(true);
  const full = Array.from({ length: 30 }, (_, i) => now - 3_000_000 + i * 10_000);
  expect(rateCheck(full, now).ok).toBe(false);
  expect(rateCheck(full, now + 3_600_000).ok).toBe(true);
});

test('Namen sind anonym und hängen am Fingerabdruck', () => {
  expect(nameFor(FP_A)).toMatch(/^[a-z]+-[0-9a-f]{3}$/);
  expect(nameFor(FP_A)).toBe(nameFor(FP_A));
  expect(nameFor(FP_A)).not.toBe(nameFor(FP_B));
});

test('Lesen ohne Ticket, Schreiben mit, alle sehen die Nachricht', async () => {
  const { room, sockets } = makeRoom();
  await connect(room, '');
  await connect(room, FP_A);
  const [reader, writer] = sockets;
  expect(reader.inbox[0]).toMatchObject({ type: 'hello', name: null, history: [] });
  expect(writer.inbox[0].name).toBe(nameFor(FP_A));

  await room.webSocketMessage(reader, JSON.stringify({ type: 'say', text: 'hi' }));
  expect(reader.inbox.at(-1)).toMatchObject({ type: 'error' });

  await room.webSocketMessage(writer, JSON.stringify({ type: 'say', text: 'hello world' }));
  for (const socket of [reader, writer]) {
    expect(socket.inbox.at(-1)).toMatchObject({ type: 'msg', message: { id: 1, name: nameFor(FP_A), text: 'hello world' } });
    expect(socket.inbox.at(-1).message).not.toHaveProperty('fp');
  }
  // Zu schnell hintereinander
  await room.webSocketMessage(writer, JSON.stringify({ type: 'say', text: 'again' }));
  expect(writer.inbox.at(-1)).toMatchObject({ type: 'error', text: 'Slow down a little.' });

  // Neue Verbindung bekommt den Verlauf
  await connect(room, '');
  expect(sockets.at(-1).inbox[0].history).toEqual([expect.objectContaining({ text: 'hello world' })]);
});

test('Drei Meldungen verschiedener Leute verstecken eine Nachricht', async () => {
  const { room, sockets } = makeRoom();
  for (const fp of [FP_A, FP_B, FP_C, FP_D]) await connect(room, fp);
  const [author, ...others] = sockets;
  await room.webSocketMessage(author, JSON.stringify({ type: 'say', text: 'something rude' }));
  // Eigene Nachricht melden zählt nicht, doppelt melden auch nicht
  await room.webSocketMessage(author, JSON.stringify({ type: 'report', id: 1 }));
  await room.webSocketMessage(others[0], JSON.stringify({ type: 'report', id: 1 }));
  await room.webSocketMessage(others[0], JSON.stringify({ type: 'report', id: 1 }));
  expect(author.inbox.some((m) => m.type === 'hide')).toBe(false);
  for (const socket of others.slice(1, REPORTS_TO_HIDE)) await room.webSocketMessage(socket, JSON.stringify({ type: 'report', id: 1 }));
  expect(author.inbox.at(-1)).toEqual({ type: 'hide', id: 1 });
  await connect(room, '');
  expect(sockets.at(-1).inbox[0].history).toEqual([]);
});

test('Admin: auflisten, verstecken, stummschalten', async () => {
  const { room, sockets } = makeRoom();
  await connect(room, FP_A);
  const [writer] = sockets;
  await room.webSocketMessage(writer, JSON.stringify({ type: 'say', text: 'first' }));
  const admin = async (body) => (await room.fetch(new Request('https://chat/admin', { method: 'POST', body: JSON.stringify(body) }))).json();
  const list = await admin({ action: 'list' });
  expect(list).toEqual([expect.objectContaining({ id: 1, text: 'first', hidden: false })]);
  expect(list[0]).not.toHaveProperty('fp');
  expect(await admin({ action: 'mute', name: nameFor(FP_A), hours: 2 })).toMatchObject({ ok: true, hidden: 1 });
  expect(writer.inbox.at(-1)).toEqual({ type: 'hide', id: 1 });
  await new Promise((resolve) => setTimeout(resolve, 10));
  await room.webSocketMessage(writer, JSON.stringify({ type: 'say', text: 'still here?' }));
  expect(writer.inbox.at(-1)).toEqual({ type: 'error', text: 'You are muted for now.' });
});

const makeEnv = () => ({
  IP_HASH_SECRET: 'test-secret',
  CHAT_ADMIN_KEY: 'admin-secret',
  LIMIT_PER_PERSON: { limit: async () => ({ success: true }) },
  CHAT: {
    idFromName: (name) => name,
    get: () => ({ fetch: async (request) => new Response(JSON.stringify({ fp: request.headers.get('X-Chat-Fp'), url: request.url })) }),
  },
});

test('Ticket nur mit Captcha, Raum bekommt nur einen geprüften Fingerabdruck', async () => {
  const env = makeEnv();
  const ticketRequest = new Request('https://worker.test/chat/ticket', {
    method: 'POST', headers: { Origin: ORIGIN, 'CF-Connecting-IP': '203.0.113.7' }, body: '{}',
  });
  const { ticket, name } = await (await worker.fetch(ticketRequest, env)).json();
  expect(name).toMatch(/^[a-z]+-[0-9a-f]{3}$/);
  expect(ticket).not.toContain('203.0.113.7');

  const join = (query, headers = {}) => worker.fetch(new Request(`https://worker.test/chat?${query}`, {
    headers: { Origin: ORIGIN, Upgrade: 'websocket', ...headers },
  }), env);
  const fp = ticket.split('.')[1];
  expect((await (await join(`ticket=${ticket}`)).json()).fp).toBe(fp);
  // Gefälschtes Ticket oder selbst gesetzter Kopf: nur lesen
  expect((await (await join(`ticket=${ticket.slice(0, -2)}xx`)).json()).fp).toBe('');
  expect((await (await join('', { 'X-Chat-Fp': fp })).json()).fp).toBe('');
  // Fremde Seite darf nicht
  expect((await worker.fetch(new Request('https://worker.test/chat', { headers: { Origin: 'https://evil.test', Upgrade: 'websocket' } }), env)).status).toBe(403);

  const withCaptcha = { ...env, TURNSTILE_SECRET: 'secret' };
  expect((await worker.fetch(new Request('https://worker.test/chat/ticket', {
    method: 'POST', headers: { Origin: ORIGIN }, body: '{}',
  }), withCaptcha)).status).toBe(403);
});

test('Admin-Zugang nur mit Schlüssel', async () => {
  const env = makeEnv();
  const admin = (key) => worker.fetch(new Request('https://worker.test/chat/admin', {
    method: 'POST', headers: key ? { 'X-Admin-Key': key } : {}, body: '{"action":"list"}',
  }), env);
  expect((await admin('')).status).toBe(403);
  expect((await admin('wrong')).status).toBe(403);
  expect((await admin('admin-secret')).status).toBe(200);
});
