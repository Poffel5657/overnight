// Nimmt Vorschläge, Stimmen, Bewertungen und Beiträge zu Community-Events aus dem Spiel an und legt sie als JSON-Dateien im privaten Inbox-Repo ab.
// Im Inbox-Repo landet nur der Text bzw. die Stimme. Die IP selbst wird nie abgelegt: Für das Limit von
// einem Vorschlag und einer Stimme pro Nacht bleibt nur ein Fingerabdruck, der sich täglich ändert und
// nach gut einem Tag verfällt.
import { ChatRoom, nameFor } from './chat.js';

// Der Chatraum ist ein Durable Object; Cloudflare findet die Klasse über diesen Export.
export { ChatRoom };

const ALLOWED_ORIGIN = 'https://poffel5657.github.io';
const MAX_LENGTH = 300;
const FINGERPRINT_TTL_SECONDS = 26 * 60 * 60;
// Stimmen und Event-Beiträge enthalten keinen Freitext, nur Zahlen und kurze IDs.
const ID_PATTERN = /^[a-z0-9-]{1,32}$/;
// Der Zähler eines Events ist nur Anzeige. Maßgeblich sind die Dateien im Inbox-Repo.
const COUNT_TTL_SECONDS = 60 * 24 * 60 * 60;

// Die Nacht wechselt um Mitternacht in Berlin, dann baut auch der Nachtlauf.
const berlinDay = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date());

async function fingerprint(ip, day, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(`${day}|${ip}`));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

const cors = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
  Vary: 'Origin',
};

const reply = (status) => new Response(null, { status, headers: cors });
const json = (data) => new Response(JSON.stringify(data), {
  status: 200,
  headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});

function base64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function captchaPassed(token, env, ip) {
  if (!env.TURNSTILE_SECRET) return true;
  if (!token) return false;
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: env.TURNSTILE_SECRET, response: token, remoteip: ip }),
  });
  return (await response.json()).success === true;
}

// Prüft den Inhalt je nach Art. Gibt die zu speichernden Felder zurück oder null, wenn ungültig.
const KINDS = {
  suggestion: {
    folder: 'suggestions',
    lock: 'sent',
    message: 'Neuer Vorschlag',
    parse(body) {
      const text = typeof body?.text === 'string'
        ? body.text.replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '').trim()
        : '';
      if (!text || [...text].length > MAX_LENGTH) return null;
      return { untrustedPlayerText: text };
    },
  },
  vote: {
    folder: 'votes',
    lock: 'voted',
    message: 'Neue Stimme',
    parse(body) {
      const { ballot, choice } = body ?? {};
      if (!Number.isInteger(ballot) || ballot < 0 || ballot > 9999) return null;
      if (typeof choice !== 'string' || !ID_PATTERN.test(choice)) return null;
      return { ballot, choice };
    },
  },
  // Ein Spieler hat seinen Teil am Community-Event für heute erledigt. Kein Captcha, damit das
  // im Spiel von selbst passieren kann; die Sperre pro Anschluss und Nacht gilt trotzdem.
  event: {
    folder: 'events',
    lock: 'helped',
    message: 'Neuer Event-Beitrag',
    captcha: false,
    parse(body) {
      const { event } = body ?? {};
      if (typeof event !== 'string' || !ID_PATTERN.test(event)) return null;
      return { event };
    },
  },
};

// Daumen hoch oder runter für die Neuerungen einer Nacht. Ein Klick, daher ohne Captcha.
KINDS.rating = {
  folder: 'ratings',
  lock: 'rated',
  message: 'Neue Bewertung',
  captcha: false,
  parse(body) {
    const { day, value } = body ?? {};
    if (!Number.isInteger(day) || day < 0 || day > 9999) return null;
    if (value !== 'up' && value !== 'down') return null;
    return { day, value };
  },
};

// Zwischenstand pro Stimmzettel als ein JSON-Objekt { choice: Anzahl }. Gleichzeitige Stimmen können
// sich überschreiben, das ist für eine Anzeige in Ordnung. Unbekannte IDs kann der Worker nicht
// erkennen; damit niemand den Eintrag aufbläht, nimmt er höchstens MAX_CHOICES verschiedene an.
const MAX_CHOICES = 8;

async function readTally(env, ballot) {
  try {
    const counts = JSON.parse(await env.SUBMISSIONS.get(`tally:${ballot}`)) ?? {};
    return typeof counts === 'object' && !Array.isArray(counts) ? counts : {};
  } catch {
    return {};
  }
}

async function addToTally(env, ballot, choice) {
  const counts = await readTally(env, ballot);
  if (!(choice in counts) && Object.keys(counts).length >= MAX_CHOICES) return;
  counts[choice] = (Number(counts[choice]) || 0) + 1;
  await env.SUBMISSIONS.put(`tally:${ballot}`, JSON.stringify(counts), { expirationTtl: COUNT_TTL_SECONDS });
}

const PATHS = { '': KINDS.suggestion, '/vote': KINDS.vote, '/event': KINDS.event, '/rate': KINDS.rating };

// Chat-Ticket: "Tag.Fingerabdruck.Signatur". Wer es hat, darf heute schreiben.
const ticketSignature = (fp, day, env) => fingerprint(`ticket:${fp}`, day, env.IP_HASH_SECRET);

async function readTicket(ticket, env) {
  const [day, fp, signature] = String(ticket ?? '').split('.');
  if (!day || !/^[0-9a-f]{64}$/.test(fp ?? '') || day !== berlinDay()) return null;
  return signature === await ticketSignature(fp, day, env) ? fp : null;
}

async function handleChat(request, env, path, url) {
  const room = env.CHAT.get(env.CHAT.idFromName('main'));

  // Moderation: nur mit dem geheimen Admin-Schlüssel, nicht aus dem Browser.
  if (path === '/chat/admin' && request.method === 'POST') {
    if (!env.CHAT_ADMIN_KEY || request.headers.get('X-Admin-Key') !== env.CHAT_ADMIN_KEY) return reply(403);
    return room.fetch(new Request('https://chat/admin', { method: 'POST', body: await request.text() }));
  }

  if (request.headers.get('Origin') !== ALLOWED_ORIGIN) return reply(403);

  // Schreibrecht für heute: Captcha lösen, Ticket bekommen.
  if (path === '/chat/ticket' && request.method === 'POST') {
    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    const perPerson = await env.LIMIT_PER_PERSON.limit({ key: ip });
    if (!perPerson.success) return reply(429);
    let body;
    try {
      body = await request.json();
    } catch {
      return reply(400);
    }
    if (!(await captchaPassed(body?.token, env, ip))) return reply(403);
    const day = berlinDay();
    const fp = await fingerprint(ip, day, env.IP_HASH_SECRET);
    return json({ ticket: `${day}.${fp}.${await ticketSignature(fp, day, env)}`, name: nameFor(fp) });
  }

  // Verbindung zum Raum. Ohne gültiges Ticket nur lesen.
  if (path === '/chat' && request.headers.get('Upgrade') === 'websocket') {
    const fp = await readTicket(url.searchParams.get('ticket'), env);
    const headers = new Headers(request.headers);
    headers.set('X-Chat-Fp', fp ?? '');
    return room.fetch(new Request(request.url, { headers }));
  }
  return reply(404);
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return reply(204);
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '');
    if (path === '/chat' || path.startsWith('/chat/')) return handleChat(request, env, path, url);

    // Zwischenstand eines Stimmzettels, öffentlich lesbar. Nur Anzeige, maßgeblich sind die Dateien.
    if (request.method === 'GET' && path === '/vote') {
      const raw = url.searchParams.get('ballot') ?? '';
      if (!/^\d{1,4}$/.test(raw)) return reply(400);
      return json({ counts: await readTally(env, Number(raw)) });
    }

    // Zählerstand eines Events, öffentlich lesbar und ohne Sperre.
    if (request.method === 'GET' && path === '/event') {
      const id = url.searchParams.get('id') ?? '';
      if (!ID_PATTERN.test(id)) return reply(400);
      return json({ count: Number(await env.SUBMISSIONS.get(`count:${id}`)) || 0 });
    }

    if (request.method !== 'POST') return reply(405);
    if (request.headers.get('Origin') !== ALLOWED_ORIGIN) return reply(403);

    const kind = PATHS[path];
    if (!kind) return reply(404);

    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    const perPerson = await env.LIMIT_PER_PERSON.limit({ key: ip });
    const overall = await env.LIMIT_OVERALL.limit({ key: 'all' });
    if (!perPerson.success || !overall.success) return reply(429);

    let body;
    try {
      body = await request.json();
    } catch {
      return reply(400);
    }
    // Honeypot: Bots bekommen eine Erfolgsmeldung, es wird aber nichts gespeichert.
    if (body?.website) return reply(204);

    const fields = kind.parse(body);
    if (!fields) return reply(400);
    if (kind.captcha !== false && !(await captchaPassed(body.token, env, ip))) return reply(403);

    const lockKey = `${kind.lock}:${await fingerprint(ip, berlinDay(), env.IP_HASH_SECRET)}`;
    if (await env.SUBMISSIONS.get(lockKey)) return reply(409);

    const now = new Date().toISOString();
    const name = `${now.replace(/[:.]/g, '-')}-${crypto.randomUUID().slice(0, 8)}.json`;
    const file = JSON.stringify({ receivedAt: now, ...fields }, null, 2);
    const stored = await fetch(`https://api.github.com/repos/${env.INBOX_REPO}/contents/${kind.folder}/${name}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'overnight-suggestions',
      },
      body: JSON.stringify({ message: kind.message, content: base64(file) }),
    });
    if (!stored.ok) return reply(502);
    // Erst nach dem Speichern sperren, damit ein Fehler niemanden die Nacht über aussperrt.
    await env.SUBMISSIONS.put(lockKey, '1', { expirationTtl: FINGERPRINT_TTL_SECONDS });
    if (kind === KINDS.vote) await addToTally(env, fields.ballot, fields.choice);
    if (kind === KINDS.event) {
      const countKey = `count:${fields.event}`;
      const count = (Number(await env.SUBMISSIONS.get(countKey)) || 0) + 1;
      await env.SUBMISSIONS.put(countKey, String(count), { expirationTtl: COUNT_TTL_SECONDS });
    }
    return reply(204);
  },
};
