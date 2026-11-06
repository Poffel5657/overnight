// Prüft den Vorschlags-Worker mit nachgebautem GitHub und Rate-Limit.
import { expect, test } from '@playwright/test';
import worker from '../../worker/index.js';

const ORIGIN = 'https://poffel5657.github.io';

const makeKv = () => {
  const entries = new Map();
  return {
    entries,
    get: async (key) => entries.get(key)?.value ?? null,
    put: async (key, value, options) => { entries.set(key, { value, options }); },
  };
};

const makeEnv = ({ allowed = true } = {}) => ({
  INBOX_REPO: 'owner/inbox',
  GITHUB_TOKEN: 'test',
  IP_HASH_SECRET: 'test-secret',
  SUBMISSIONS: makeKv(),
  LIMIT_PER_PERSON: { limit: async () => ({ success: allowed }) },
  LIMIT_OVERALL: { limit: async () => ({ success: true }) },
});

const post = (body, origin = ORIGIN) => new Request('https://worker.test/', {
  method: 'POST',
  headers: { Origin: origin, 'Content-Type': 'application/json' },
  body: typeof body === 'string' ? body : JSON.stringify(body),
});

const withFakeGitHub = async (run) => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    return new Response('{}', { status: 201 });
  };
  try {
    await run(calls);
  } finally {
    globalThis.fetch = original;
  }
};

test('Gültiger Vorschlag wird als Datei abgelegt, ohne IP', async () => {
  await withFakeGitHub(async (calls) => {
    const response = await worker.fetch(post({ text: '  a tiny dragon ö ' }), makeEnv());
    expect(response.status).toBe(204);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toMatch(/\/repos\/owner\/inbox\/contents\/suggestions\/.+\.json$/);
    const stored = JSON.parse(Buffer.from(JSON.parse(calls[0].options.body).content, 'base64').toString());
    expect(stored.untrustedPlayerText).toBe('a tiny dragon ö');
    expect(Object.keys(stored).sort()).toEqual(['receivedAt', 'untrustedPlayerText']);
  });
});

const postFrom = (ip) => new Request('https://worker.test/', {
  method: 'POST',
  headers: { Origin: ORIGIN, 'Content-Type': 'application/json', 'CF-Connecting-IP': ip },
  body: JSON.stringify({ text: 'hi' }),
});

test('Pro Anschluss zählt ein Vorschlag pro Nacht, ohne die IP abzulegen', async () => {
  await withFakeGitHub(async (calls) => {
    const env = makeEnv();
    expect((await worker.fetch(postFrom('203.0.113.7'), env)).status).toBe(204);
    expect((await worker.fetch(postFrom('203.0.113.7'), env)).status).toBe(409);
    expect((await worker.fetch(postFrom('198.51.100.9'), env)).status).toBe(204);
    expect(calls).toHaveLength(2);
    const keys = [...env.SUBMISSIONS.entries.keys()];
    expect(keys).toHaveLength(2);
    expect(keys.join()).not.toContain('203.0.113.7');
    for (const { options } of env.SUBMISSIONS.entries.values()) {
      expect(options.expirationTtl).toBeLessThanOrEqual(26 * 60 * 60);
    }
  });
});

test('Scheitert das Speichern, bleibt der Anschluss frei', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response('{}', { status: 500 });
  try {
    const env = makeEnv();
    expect((await worker.fetch(postFrom('203.0.113.7'), env)).status).toBe(502);
    expect(env.SUBMISSIONS.entries.size).toBe(0);
  } finally {
    globalThis.fetch = original;
  }
});

test('Ein neuer Tag gibt einen neuen Fingerabdruck', async () => {
  await withFakeGitHub(async () => {
    const RealDate = Date;
    const env = makeEnv();
    try {
      globalThis.Date = class extends RealDate {
        constructor(...args) { super(...(args.length ? args : ['2026-11-05T12:00:00Z'])); }
      };
      expect((await worker.fetch(postFrom('203.0.113.7'), env)).status).toBe(204);
      globalThis.Date = class extends RealDate {
        constructor(...args) { super(...(args.length ? args : ['2026-11-05T23:30:00Z'])); }
      };
      expect((await worker.fetch(postFrom('203.0.113.7'), env)).status).toBe(204);
    } finally {
      globalThis.Date = RealDate;
    }
    expect(env.SUBMISSIONS.entries.size).toBe(2);
  });
});

test('Ungültige Anfragen speichern nichts', async () => {
  await withFakeGitHub(async (calls) => {
    expect((await worker.fetch(post({ text: 'x'.repeat(301) }), makeEnv())).status).toBe(400);
    expect((await worker.fetch(post({ text: '   ' }), makeEnv())).status).toBe(400);
    expect((await worker.fetch(post('kein json'), makeEnv())).status).toBe(400);
    expect((await worker.fetch(post({ text: 'hi' }, 'https://evil.test'), makeEnv())).status).toBe(403);
    expect((await worker.fetch(post({ text: 'hi' }), makeEnv({ allowed: false }))).status).toBe(429);
    expect((await worker.fetch(post({ text: 'hi', website: 'spam' }), makeEnv())).status).toBe(204);
    expect((await worker.fetch(new Request('https://worker.test/'), makeEnv())).status).toBe(405);
    expect(calls).toHaveLength(0);
  });
});

test('Ohne Captcha-Token wird abgelehnt, wenn Turnstile aktiv ist', async () => {
  await withFakeGitHub(async (calls) => {
    const env = { ...makeEnv(), TURNSTILE_SECRET: 'secret' };
    expect((await worker.fetch(post({ text: 'hi' }), env)).status).toBe(403);
    expect(calls).toHaveLength(0);
  });
});

const vote = (body, ip = '203.0.113.7', path = '/vote') => new Request(`https://worker.test${path}`, {
  method: 'POST',
  headers: { Origin: ORIGIN, 'Content-Type': 'application/json', 'CF-Connecting-IP': ip },
  body: JSON.stringify(body),
});

test('Gültige Stimme wird unter votes/ abgelegt, nur Stimmzettel und Wahl', async () => {
  await withFakeGitHub(async (calls) => {
    const response = await worker.fetch(vote({ ballot: 3, choice: 'well-drains', text: 'extra' }), makeEnv());
    expect(response.status).toBe(204);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toMatch(/\/repos\/owner\/inbox\/contents\/votes\/.+\.json$/);
    const stored = JSON.parse(Buffer.from(JSON.parse(calls[0].options.body).content, 'base64').toString());
    expect(stored).toMatchObject({ ballot: 3, choice: 'well-drains' });
    expect(Object.keys(stored).sort()).toEqual(['ballot', 'choice', 'receivedAt']);
  });
});

test('Eine Stimme pro Nacht, unabhängig vom Vorschlag', async () => {
  await withFakeGitHub(async (calls) => {
    const env = makeEnv();
    expect((await worker.fetch(vote({ ballot: 3, choice: 'a' }), env)).status).toBe(204);
    expect((await worker.fetch(vote({ ballot: 3, choice: 'b' }), env)).status).toBe(409);
    expect((await worker.fetch(vote({ ballot: 3, choice: 'a' }, '198.51.100.9'), env)).status).toBe(204);
    expect((await worker.fetch(postFrom('203.0.113.7'), env)).status).toBe(204);
    expect(calls).toHaveLength(3);
    expect([...env.SUBMISSIONS.entries.keys()].join()).not.toContain('203.0.113.7');
  });
});

test('Ungültige Stimmen speichern nichts', async () => {
  await withFakeGitHub(async (calls) => {
    const env = makeEnv();
    for (const body of [
      { ballot: 3 },
      { ballot: '3', choice: 'a' },
      { ballot: -1, choice: 'a' },
      { ballot: 3, choice: 'Hello world' },
      { ballot: 3, choice: 'x'.repeat(33) },
      { ballot: 3, choice: '<b>' },
    ]) {
      expect((await worker.fetch(vote(body), env)).status).toBe(400);
    }
    expect((await worker.fetch(vote({ ballot: 3, choice: 'a' }, '203.0.113.7', '/other'), env)).status).toBe(404);
    expect((await worker.fetch(vote({ ballot: 3, choice: 'a', website: 'spam' }), env)).status).toBe(204);
    const withCaptcha = { ...makeEnv(), TURNSTILE_SECRET: 'secret' };
    expect((await worker.fetch(vote({ ballot: 3, choice: 'a' }), withCaptcha)).status).toBe(403);
    expect(calls).toHaveLength(0);
  });
});

const help = (body, ip = '203.0.113.7') => new Request('https://worker.test/event', {
  method: 'POST',
  headers: { Origin: ORIGIN, 'Content-Type': 'application/json', 'CF-Connecting-IP': ip },
  body: JSON.stringify(body),
});
const count = async (env, id) => (await (await worker.fetch(new Request(`https://worker.test/event?id=${id}`), env)).json()).count;

test('Event-Beiträge brauchen kein Captcha, zählen einmal pro Nacht und landen unter events/', async () => {
  await withFakeGitHub(async (calls) => {
    const env = { ...makeEnv(), TURNSTILE_SECRET: 'secret' };
    expect(await count(env, 'rat-count')).toBe(0);
    expect((await worker.fetch(help({ event: 'rat-count' }), env)).status).toBe(204);
    expect((await worker.fetch(help({ event: 'rat-count' }), env)).status).toBe(409);
    expect((await worker.fetch(help({ event: 'rat-count' }, '198.51.100.9'), env)).status).toBe(204);
    expect(await count(env, 'rat-count')).toBe(2);
    expect(await count(env, 'other')).toBe(0);
    expect(calls).toHaveLength(2);
    expect(calls[0].url).toMatch(/\/contents\/events\/.+\.json$/);
    const stored = JSON.parse(Buffer.from(JSON.parse(calls[0].options.body).content, 'base64').toString());
    expect(Object.keys(stored).sort()).toEqual(['event', 'receivedAt']);
    expect([...env.SUBMISSIONS.entries.keys()].join()).not.toContain('203.0.113.7');
  });
});

test('Ungültige Event-Anfragen speichern nichts', async () => {
  await withFakeGitHub(async (calls) => {
    const env = makeEnv();
    expect((await worker.fetch(help({ event: 'Not Valid' }), env)).status).toBe(400);
    expect((await worker.fetch(help({}), env)).status).toBe(400);
    expect((await worker.fetch(new Request('https://worker.test/event?id=<x>'), env)).status).toBe(400);
    expect((await worker.fetch(new Request('https://worker.test/vote'), env)).status).toBe(405);
    expect(calls).toHaveLength(0);
  });
});
