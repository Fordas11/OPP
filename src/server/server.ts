import { createServer } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';
import { isDifficulty } from '../shared/constants.js';
import type { ClientMessage } from '../shared/messages.js';
import { createRoom, findRoom, joinRoom, leaveRoom } from './rooms.js';
import { serveFile } from './static.js';

const PORT = Number(process.env.PORT) || 3000;

const httpServer = createServer((request, response) => void serveFile(request, response));
const webSocketServer = new WebSocketServer({ server: httpServer });

webSocketServer.on('connection', socket => {
  socket.on('message', data => {
    try {
      handleMessage(socket, JSON.parse(data.toString()) as ClientMessage);
    } catch {
      // ignore messages that are not valid JSON
    }
  });
  socket.on('close', () => leaveRoom(socket));
});

// Hosting sites close connections that stay silent for about a minute (for example in the lobby).
// A ping every 25 seconds keeps them open. Browsers answer pings automatically.
setInterval(() => webSocketServer.clients.forEach(socket => socket.ping()), 25_000);

function handleMessage(socket: WebSocket, message: ClientMessage): void {
  switch (message.type) {
    case 'create-room':
      createRoom(socket, isDifficulty(message.difficulty) ? message.difficulty : 'standard');
      break;
    case 'join-room':
      joinRoom(socket, String(message.code));
      break;
    case 'start-game':
      findRoom(socket)?.start(socket);
      break;
    case 'input':
      findRoom(socket)?.handleInput(socket, message.input);
      break;
    case 'restart':
      findRoom(socket)?.restartIfOver();
      break;
  }
}

httpServer.listen(PORT, () => console.log(`Game running at http://localhost:${PORT}`));
