import { readFile } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { extname, join, resolve } from 'node:path';

const FOLDERS = [resolve('public'), resolve('dist')]; // html/css first, then compiled scripts
const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

/** Serves the game page and its scripts from the public and dist folders. */
export async function serveFile(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const path = new URL(request.url ?? '/', 'http://localhost').pathname;
  const name = path === '/' ? '/index.html' : path;

  for (const folder of FOLDERS) {
    const file = join(folder, name);
    if (!file.startsWith(folder)) continue; // blocks ../ tricks
    try {
      const content = await readFile(file);
      // no-cache: the browser always checks for a newer build instead of reusing old scripts
      response.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' });
      response.end(content);
      return;
    } catch {
      // not in this folder, try the next one
    }
  }
  response.writeHead(404);
  response.end('Not found');
}
