// Kleiner statischer Server für Tests und lokales Spielen, nur auf 127.0.0.1.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';

const ROOT = process.cwd();
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
};

createServer(async (request, response) => {
  const { pathname } = new URL(request.url, 'http://localhost');
  const path = normalize(join(ROOT, decodeURIComponent(pathname)));
  if (path !== ROOT && !path.startsWith(ROOT + sep)) {
    response.writeHead(403).end();
    return;
  }
  const file = pathname.endsWith('/') ? join(path, 'index.html') : path;
  try {
    const body = await readFile(file);
    response.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(404).end();
  }
}).listen(4173, '127.0.0.1', () => console.log('http://127.0.0.1:4173/'));
