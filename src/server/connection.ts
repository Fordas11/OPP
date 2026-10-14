import type { WebSocket } from 'ws';
import type { ServerMessage } from '../shared/messages.js';

/** Target: the only thing a room needs from a player's connection. */
export interface Connection {
  send(message: ServerMessage): void;
}

/**
 * Adapter pattern. The adaptee is the `ws` WebSocket: it has many methods and only sends text.
 * The adapter gives the game one simple send(message) and does the JSON and "is it open" work.
 */
export class WebSocketAdapter implements Connection {
  public constructor(private readonly socket: WebSocket) {}

  public send(message: ServerMessage): void {
    if (this.socket.readyState !== this.socket.OPEN) return;
    this.socket.send(JSON.stringify(message));
  }
}
