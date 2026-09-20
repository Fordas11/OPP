import { JsonProtocolAdapter, type ClientMessage, type ServerMessage } from '../shared/protocol';

export interface NetworkClient { connect(url: string): void; send(message: ClientMessage): void; disconnect(): void; }

/** WebSocket client template. The matching server owns RoomRegistry and broadcasts snapshots. */
export class WebSocketGameClient implements NetworkClient {
  private socket?: WebSocket;
  private readonly protocol = new JsonProtocolAdapter();
  public onMessage?: (message: ServerMessage) => void;

  public connect(url: string): void {
    this.socket = new WebSocket(url);
    this.socket.addEventListener('message', event => this.onMessage?.(this.protocol.decode(String(event.data)) as ServerMessage));
  }
  public send(message: ClientMessage): void { if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(this.protocol.encode(message)); }
  public disconnect(): void { this.socket?.close(); this.socket = undefined; }
}
