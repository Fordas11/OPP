import type { WebSocket } from 'ws';
import type { ServerMessage } from '../shared/core/messages.js';

/** Adapter target. */
export interface Connection {
  send(message: ServerMessage): void;
  sendJson(json: string): void; // pre-encoded message
}

/** Adapter: wraps a `ws` socket (JSON + open check). */
export class WebSocketAdapter implements Connection {
  public constructor(private readonly socket: WebSocket) {}

  public send(message: ServerMessage): void {
    this.sendJson(JSON.stringify(message));
  }

  public sendJson(json: string): void {
    if (this.socket.readyState !== this.socket.OPEN) return;
    this.socket.send(json);
  }
}
