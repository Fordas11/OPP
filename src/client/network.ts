import type { ClientMessage, ServerMessage } from '../shared/messages.js';

/** Facade subsystem: the WebSocket to the server. */
export class ServerConnection {
  private socket: WebSocket | null = null;

  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  /** Opens a WebSocket to the server that served this page. */
  public connect(onMessage: (message: ServerMessage) => void, onLost: () => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const protocol = location.protocol === 'https:' ? 'wss' : 'ws'; // hosting sites serve the page over https
      const ws = new WebSocket(`${protocol}://${location.host}`);
      this.socket = ws;
      ws.onopen = () => resolve();
      ws.onerror = () => reject(new Error('Cannot reach the server.'));
      ws.onmessage = event => onMessage(JSON.parse(event.data) as ServerMessage);
      ws.onclose = () => {
        if (this.socket !== ws) return; // we closed it on purpose
        this.socket = null;
        onLost();
      };
    });
  }

  public send(message: ClientMessage): void {
    if (this.isConnected()) this.socket!.send(JSON.stringify(message));
  }

  public disconnect(): void {
    const old = this.socket;
    this.socket = null;
    old?.close();
  }
}
