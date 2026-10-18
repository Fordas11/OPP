import type { WebSocket } from 'ws';
import type { ServerMessage } from '../shared/messages.js';

export interface Connection {
  readonly sent: number; // how many messages went through this connection
  send(message: ServerMessage): void;
}

export class WebSocketAdapter implements Connection {
  public sent = 0;

  public constructor(private readonly socket: WebSocket) {}

  public send(message: ServerMessage): void {
    if (this.socket.readyState !== this.socket.OPEN) return;
    this.socket.send(JSON.stringify(message));
    this.sent++;
  }
}
