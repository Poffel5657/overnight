// Sicherheitsgrenzen. Diese Datei ist geschützt und setzt durch, was die Regeln verlangen.
import { expect, test } from '@playwright/test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Einzige erlaubte Richtlinie. Beim Anbinden des Workers wird nur connect-src angepasst.
const EXPECTED_CSP = "default-src 'none'; script-src 'self' https://challenges.cloudflare.com; style-src 'self'; img-src 'self' data:; connect-src 'none'; frame-src https://challenges.cloudflare.com; base-uri 'none'; form-action 'none'";

const NETWORK_ALLOWED = new Set(['src/suggest.js', 'src/config.js']);

const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? walk(path) : [path];
});

const BANNED = [
  [/\binnerHTML\b|\bouterHTML\b|insertAdjacentHTML|document\.write/, 'HTML aus Text'],
  [/\beval\s*\(|new\s+Function|\bFunction\s*\(/, 'Code aus Text'],
];

const BANNED_NETWORK = [
  [/https?:\/\/|wss?:\/\/|\/\/[a-z0-9-]+\.[a-z]{2,}/i, 'externe Adresse'],
  [/\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|RTCPeerConnection/, 'Netzwerkaufruf'],
  [/createElement\s*\(\s*['"`](script|iframe|img|link|object|embed)/i, 'nachgeladenes Element'],
  [/\bimport\s*\(/, 'dynamischer Import'],
  [/window\.open|location\s*\.\s*(href|assign|replace)\s*[=(]/, 'Weiterleitung'],
  [/navigator\.(clipboard|geolocation|mediaDevices)/, 'Geräte-API'],
];

const files = [...walk('src'), ...walk('content')]
  .map((path) => path.split('\\').join('/'))
  .filter((path) => path.endsWith('.js'));

for (const file of files) {
  test(`${file} hält die Sicherheitsgrenzen ein`, () => {
    const code = readFileSync(file, 'utf8');
    const rules = NETWORK_ALLOWED.has(file) ? BANNED : [...BANNED, ...BANNED_NETWORK];
    const hits = rules.filter(([pattern]) => pattern.test(code)).map(([, label]) => label);
    expect(hits).toEqual([]);
  });
}

test('index.html lädt nur erlaubte Dateien und hat die erwartete CSP', () => {
  const html = readFileSync('index.html', 'utf8');
  expect(html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1]).toBe(EXPECTED_CSP);
  expect([...html.matchAll(/<script\b[^>]*>/g)].map(([tag]) => tag))
    .toEqual(['<script type="module" src="src/main.js">']);
  expect(html.match(/<script\b[^>]*>([\s\S]*?)<\/script>/)?.[1].trim()).toBe('');
  expect([...html.matchAll(/<link\b[^>]*href="([^"]+)"/g)].map(([, href]) => href).sort())
    .toEqual(['data:,', 'style.css']);
  expect(html).not.toMatch(/<(iframe|object|embed|base|img)\b/i);
  expect(html).not.toMatch(/\son[a-z]+\s*=/i);
});

test('style.css lädt nichts von außen', () => {
  const css = readFileSync('style.css', 'utf8');
  expect(css).not.toMatch(/@import|url\s*\(/i);
});
