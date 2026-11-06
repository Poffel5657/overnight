#!/usr/bin/env node
// Chat-Moderation für Chris. Der Schlüssel liegt nur lokal, nie im Repo:
//   ~/.config/overnight/chat-admin-key   (oder Umgebungsvariable OVERNIGHT_CHAT_ADMIN_KEY)
//
//   node tools/chat-admin.mjs list [Anzahl]       letzte Nachrichten, mit ID, Name, Meldungen
//   node tools/chat-admin.mjs hide <id>           Nachricht für alle verstecken
//   node tools/chat-admin.mjs mute <name> [Std]   Schreiber stummschalten (Standard 24 h) und alles von ihm verstecken
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const URL_ADMIN = 'https://overnight-suggestions.overnight-rpg.workers.dev/chat/admin';

function key() {
  if (process.env.OVERNIGHT_CHAT_ADMIN_KEY) return process.env.OVERNIGHT_CHAT_ADMIN_KEY.trim();
  try {
    return readFileSync(join(homedir(), '.config', 'overnight', 'chat-admin-key'), 'utf8').trim();
  } catch {
    console.error('Kein Admin-Schlüssel gefunden (~/.config/overnight/chat-admin-key).');
    process.exit(1);
  }
}

const [action, arg, extra] = process.argv.slice(2);
const bodies = {
  list: () => ({ action: 'list', limit: Number(arg) || 50 }),
  hide: () => ({ action: 'hide', id: Number(arg) }),
  mute: () => ({ action: 'mute', name: arg, hours: Number(extra) || 24 }),
};
if (!bodies[action] || (action !== 'list' && !arg)) {
  console.error('Aufruf: list [Anzahl] | hide <id> | mute <name> [Stunden]');
  process.exit(1);
}

const response = await fetch(URL_ADMIN, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Admin-Key': key() },
  body: JSON.stringify(bodies[action]()),
});
if (!response.ok) {
  console.error(`Fehler ${response.status}`);
  process.exit(1);
}
const data = await response.json();
if (action === 'list') {
  for (const m of data) {
    const flags = `${m.hidden ? ' [versteckt]' : ''}${m.reports ? ` [${m.reports}x gemeldet]` : ''}`;
    console.log(`#${m.id} ${m.ts.slice(5, 16).replace('T', ' ')} ${m.name}: ${m.text}${flags}`);
  }
  if (!data.length) console.log('Noch keine Nachrichten.');
} else {
  console.log(JSON.stringify(data));
}
