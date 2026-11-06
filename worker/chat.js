// Chat für Overnight: ein Raum als Durable Object, Nachrichten per WebSocket (Hibernation-API).
// Wer liest, braucht nichts. Wer schreibt, braucht ein Ticket (einmal pro Tag mit Captcha, siehe index.js).
// Namen vergibt der Server aus dem Tages-Fingerabdruck, niemand wählt seinen eigenen.
// Gespeichert wird über ctx.storage.get/put, damit die Tests den Speicher mit einer Map nachbauen können.

export const MAX_TEXT = 200;
export const HISTORY = 50;
export const KEEP = 200;
export const MIN_GAP_MS = 5000;
export const MAX_PER_HOUR = 30;
export const REPORTS_TO_HIDE = 3;

const NAMES = [
  'wanderer', 'lamplighter', 'tinker', 'cartographer', 'gardener', 'bellringer', 'scribe', 'mapmaker',
  'stargazer', 'beekeeper', 'ferryman', 'whittler', 'lantern', 'pilgrim', 'weaver', 'nightowl',
];

// Anonymer Name aus dem Fingerabdruck (Hex), zum Beispiel "lamplighter-3f2". Wechselt mit dem Fingerabdruck täglich.
export const nameFor = (fp) => `${NAMES[parseInt(fp.slice(0, 2), 16) % NAMES.length]}-${fp.slice(2, 5)}`;

// Grober Wortfilter. Er ersetzt keine Moderation, er fängt nur das Offensichtlichste ab.
// Stämme: Wörter, die damit beginnen, werden abgelehnt. Erweiterbar, wenn etwas durchrutscht.
const BLOCKED_STEMS = [
  'fuck', 'shit', 'cunt', 'bitch', 'dickhead', 'cocksuck', 'pussy', 'whore', 'slut', 'porn', 'nude', 'nudes',
  'sex', 'rape', 'nazi', 'hitler', 'nigg', 'fagg', 'retard', 'kys', 'kill yourself',
  'fick', 'scheiß', 'scheiss', 'hure', 'fotze', 'wichs', 'schwuchtel', 'missgeburt', 'spast', 'behindert',
];
const LEET = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', '@': 'a', $: 's', '!': 'i' };

const normalize = (text) => text
  .toLowerCase()
  .replace(/[013457@$!]/g, (c) => LEET[c])
  .replace(/(.)\1{2,}/g, '$1$1');

const LINK = /https?:|www\.|\b[a-z0-9-]+\.(com|net|org|de|io|gg|ly|xyz|me|app|tv|ru|info)\b|discord\.gg/i;

// Prüft eine Nachricht. Gibt den bereinigten Text zurück oder einen Fehlertext für den Schreiber.
export function checkText(raw) {
  if (typeof raw !== 'string') return { error: 'Empty message.' };
  const text = raw.replace(/[\u0000-\u001f\u007f​-‏‪-‮]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return { error: 'Empty message.' };
  if ([...text].length > MAX_TEXT) return { error: `At most ${MAX_TEXT} characters.` };
  if (LINK.test(text)) return { error: 'No links in the chat, sorry.' };
  // Zwei Formen: Buchstabenketten auf zwei gekürzt ("fuuuck" -> "fuuck") und auf einen ("fuck").
  // Die einfache Form gilt nur für Stämme ohne Doppelbuchstaben, sonst würde "nigg" zu "nig" und "night" träfe.
  const squashed = normalize(text).replace(/[^a-zäöüß ]/g, '');
  const single = squashed.replace(/(.)\1+/g, '$1');
  const hits = (form, stem) => (stem.includes(' ') ? form.includes(stem) : form.split(' ').some((word) => word.startsWith(stem)));
  for (const stem of BLOCKED_STEMS) {
    const hasDouble = /(.)\1/.test(stem);
    if (hits(squashed, stem) || (!hasDouble && hits(single, stem))) {
      return { error: 'The Nightwright would rather not have that in the chat.' };
    }
  }
  return { text };
}

// Rate-Limit pro Fingerabdruck: Liste der Zeitstempel der letzten Stunde.
export function rateCheck(times, now) {
  const recent = times.filter((t) => now - t < 3600_000);
  if (recent.length && now - recent.at(-1) < MIN_GAP_MS) return { ok: false, recent, error: 'Slow down a little.' };
  if (recent.length >= MAX_PER_HOUR) return { ok: false, recent, error: 'That is enough chat for this hour.' };
  return { ok: true, recent: [...recent, now] };
}

const publicMessage = ({ id, ts, name, text }) => ({ id, ts, name, text });

export class ChatRoom {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
  }

  async messages() {
    return (await this.ctx.storage.get('messages')) ?? [];
  }

  broadcast(data) {
    const payload = JSON.stringify(data);
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(payload);
      } catch {
        // Verbindung ist schon weg.
      }
    }
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === '/admin') return this.admin(await request.json());

    const fp = request.headers.get('X-Chat-Fp') ?? '';
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    const name = fp ? nameFor(fp) : null;
    server.serializeAttachment({ fp, name });
    const visible = (await this.messages()).filter((m) => !m.hidden).slice(-HISTORY).map(publicMessage);
    server.send(JSON.stringify({ type: 'hello', name, history: visible }));
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, raw) {
    const { fp, name } = ws.deserializeAttachment() ?? {};
    let data;
    try {
      data = JSON.parse(typeof raw === 'string' ? raw : new TextDecoder().decode(raw));
    } catch {
      return;
    }
    const error = (text) => ws.send(JSON.stringify({ type: 'error', text }));
    if (!fp) return error('Join the chat first.');

    if (data?.type === 'say') {
      const mutes = (await this.ctx.storage.get('mutes')) ?? {};
      if ((mutes[fp] ?? 0) > Date.now()) return error('You are muted for now.');
      const checked = checkText(data.text);
      if (checked.error) return error(checked.error);
      const rate = rateCheck((await this.ctx.storage.get(`rate:${fp}`)) ?? [], Date.now());
      await this.ctx.storage.put(`rate:${fp}`, rate.recent);
      if (!rate.ok) return error(rate.error);

      const messages = await this.messages();
      const id = ((await this.ctx.storage.get('lastId')) ?? 0) + 1;
      const message = { id, ts: Date.now(), name, fp, text: checked.text, hidden: false, reports: [] };
      messages.push(message);
      await this.ctx.storage.put('messages', messages.slice(-KEEP));
      await this.ctx.storage.put('lastId', id);
      this.broadcast({ type: 'msg', message: publicMessage(message) });
      return undefined;
    }

    if (data?.type === 'report' && Number.isInteger(data.id)) {
      const messages = await this.messages();
      const message = messages.find((m) => m.id === data.id);
      if (!message || message.hidden || message.fp === fp || message.reports.includes(fp)) return undefined;
      message.reports.push(fp);
      if (message.reports.length >= REPORTS_TO_HIDE) message.hidden = true;
      await this.ctx.storage.put('messages', messages);
      if (message.hidden) this.broadcast({ type: 'hide', id: message.id });
      ws.send(JSON.stringify({ type: 'reported', id: message.id }));
    }
    return undefined;
  }

  async webSocketClose(ws, code) {
    try {
      ws.close(code === 1005 ? 1000 : code, 'bye');
    } catch {
      // schon zu
    }
  }

  async webSocketError() {}

  // Moderation durch Chris: auflisten, Nachricht verstecken, Schreiber stummschalten.
  async admin(body) {
    const messages = await this.messages();
    const ok = (data) => new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
    if (body?.action === 'list') {
      return ok(messages.slice(-(body.limit ?? 50)).map(({ id, ts, name, text, hidden, reports }) => ({
        id, ts: new Date(ts).toISOString(), name, text, hidden, reports: reports.length,
      })));
    }
    if (body?.action === 'hide' && Number.isInteger(body.id)) {
      const message = messages.find((m) => m.id === body.id);
      if (!message) return ok({ ok: false, error: 'not found' });
      message.hidden = true;
      await this.ctx.storage.put('messages', messages);
      this.broadcast({ type: 'hide', id: message.id });
      return ok({ ok: true });
    }
    if (body?.action === 'mute' && typeof body.name === 'string') {
      const target = [...messages].reverse().find((m) => m.name === body.name);
      if (!target) return ok({ ok: false, error: 'name not found' });
      const hours = Math.min(Math.max(Number(body.hours) || 24, 1), 24 * 30);
      const mutes = (await this.ctx.storage.get('mutes')) ?? {};
      mutes[target.fp] = Date.now() + hours * 3600_000;
      // Alte Einträge aufräumen, damit die Liste nicht wächst.
      for (const [key, until] of Object.entries(mutes)) if (until < Date.now()) delete mutes[key];
      await this.ctx.storage.put('mutes', mutes);
      // Alles von diesem Schreiber verstecken.
      let hidden = 0;
      for (const m of messages) if (m.fp === target.fp && !m.hidden) { m.hidden = true; hidden += 1; this.broadcast({ type: 'hide', id: m.id }); }
      await this.ctx.storage.put('messages', messages);
      return ok({ ok: true, hours, hidden });
    }
    return ok({ ok: false, error: 'unknown action' });
  }
}
