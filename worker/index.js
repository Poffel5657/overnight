// Nimmt Vorschläge und Stimmen aus dem Spiel an und legt sie als JSON-Dateien im privaten Inbox-Repo ab.
// Im Inbox-Repo landet nur der Text bzw. die Stimme. Die IP selbst wird nie abgelegt: Für das Limit von
// einem Vorschlag und einer Stimme pro Nacht bleibt nur ein Fingerabdruck, der sich täglich ändert und
// nach gut einem Tag verfällt.
const ALLOWED_ORIGIN = 'https://poffel5657.github.io';
const MAX_LENGTH = 300;
const FINGERPRINT_TTL_SECONDS = 26 * 60 * 60;
// Stimmen enthalten keinen Freitext, nur die Nummer des Stimmzettels und eine kurze ID.
const CHOICE_PATTERN = /^[a-z0-9-]{1,32}$/;

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
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
  Vary: 'Origin',
};

const reply = (status) => new Response(null, { status, headers: cors });

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
      if (typeof choice !== 'string' || !CHOICE_PATTERN.test(choice)) return null;
      return { ballot, choice };
    },
  },
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return reply(204);
    if (request.method !== 'POST') return reply(405);
    if (request.headers.get('Origin') !== ALLOWED_ORIGIN) return reply(403);

    const path = new URL(request.url).pathname.replace(/\/+$/, '');
    const kind = path === '/vote' ? KINDS.vote : path === '' ? KINDS.suggestion : null;
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
    if (!(await captchaPassed(body.token, env, ip))) return reply(403);

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
    return reply(204);
  },
};
