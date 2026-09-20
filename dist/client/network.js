import { JsonProtocolAdapter } from '../shared/protocol';
/** WebSocket client template. The matching server owns RoomRegistry and broadcasts snapshots. */
export class WebSocketGameClient {
    socket;
    protocol = new JsonProtocolAdapter();
    onMessage;
    connect(url) {
        this.socket = new WebSocket(url);
        this.socket.addEventListener('message', event => this.onMessage?.(this.protocol.decode(String(event.data))));
    }
    send(message) { if (this.socket?.readyState === WebSocket.OPEN)
        this.socket.send(this.protocol.encode(message)); }
    disconnect() { this.socket?.close(); this.socket = undefined; }
}
