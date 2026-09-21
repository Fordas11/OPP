import type { WebSocket } from 'ws';
import type { Difficulty } from '../shared/constants.js';
import { Room, send } from './room.js';

const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I or O, they look like 1 and 0
const rooms = new Map<string, Room>();

export function createRoom(socket: WebSocket, difficulty: Difficulty): void {
  leaveRoom(socket);
  const room = new Room(makeCode(), difficulty);
  rooms.set(room.code, room);
  room.add(socket);
}

export function joinRoom(socket: WebSocket, code: string): void {
  const room = rooms.get(code.trim().toUpperCase());
  if (!room) return send(socket, { type: 'error', message: 'Room not found.' });
  if (room.isStarted()) return send(socket, { type: 'error', message: 'That game has already started.' });
  if (room.isFull()) return send(socket, { type: 'error', message: 'Room is full.' });

  leaveRoom(socket);
  room.add(socket);
}

export function findRoom(socket: WebSocket): Room | undefined {
  return [...rooms.values()].find(room => room.has(socket));
}

/** Takes the player out of their room. An empty room is deleted. */
export function leaveRoom(socket: WebSocket): void {
  const room = findRoom(socket);
  if (!room) return;
  room.remove(socket);
  if (room.isEmpty()) rooms.delete(room.code);
}

function makeCode(): string {
  let code = '';
  do {
    code = Array.from({ length: 4 }, () => LETTERS[Math.floor(Math.random() * LETTERS.length)]).join('');
  } while (rooms.has(code));
  return code;
}
