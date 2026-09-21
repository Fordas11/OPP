import type { ClientMessage, ServerMessage } from '../shared/messages.js';

let socket: WebSocket | null = null;

export function isConnected(): boolean {
  return socket !== null && socket.readyState === WebSocket.OPEN;
}

/** Opens a WebSocket to the server that served this page. */
export function connect(onMessage: (message: ServerMessage) => void, onLost: () => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws'; // hosting sites serve the page over https
    const ws = new WebSocket(`${protocol}://${location.host}`);
    socket = ws;
    ws.onopen = () => resolve();
    ws.onerror = () => reject(new Error('Cannot reach the server.'));
    ws.onmessage = event => onMessage(JSON.parse(event.data) as ServerMessage);
    ws.onclose = () => {
      if (socket !== ws) return; // we closed it on purpose
      socket = null;
      onLost();
    };
  });
}

export function send(message: ClientMessage): void {
  if (isConnected()) socket!.send(JSON.stringify(message));
}

export function disconnect(): void {
  const old = socket;
  socket = null;
  old?.close();
}
