import { readFile } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { extname, join, resolve } from 'node:path';

const FOLDERS = [resolve('public'), resolve('dist')];
const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

/** Serves files from public/ and dist/. */
export async function serveFile(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const path = new URL(request.url ?? '/', 'http://localhost').pathname;
  const name = path === '/' ? '/index.html' : path;

  for (const folder of FOLDERS) {
    const file = join(folder, name);
    if (!file.startsWith(folder)) continue; // block ../
    try {
      const content = await readFile(file);
      // always check for a newer build
      response.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' });
      response.end(content);
      return;
    } catch {
      // try the next folder
    }
  }
  response.writeHead(404);
  response.end('Not found');
}
