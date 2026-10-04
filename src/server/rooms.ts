import type { WebSocket } from 'ws';
import type { Difficulty } from '../shared/constants.js';
import { Room, send } from './room.js';

const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I or O, they look like 1 and 0
/** Singleton: one shared registry. Node's event loop runs each synchronous Map
 * operation to completion, so create/join/leave cannot interleave mid-operation. */
export class RoomRegistry {
  private static instance: RoomRegistry | undefined;
  private readonly rooms = new Map<string, Room>();
  private constructor() {}
  public static getInstance(): RoomRegistry { return RoomRegistry.instance ??= new RoomRegistry(); }
  public create(socket: WebSocket, difficulty: Difficulty): void {
    this.leave(socket);
    const room = new Room(this.makeCode(), difficulty);
    this.rooms.set(room.code, room);
    room.add(socket);
  }
  public join(socket: WebSocket, code: string): void {
    const room = this.rooms.get(code.trim().toUpperCase());
    if (!room) return send(socket, { type: 'error', message: 'Room not found.' });
    if (room.isStarted()) return send(socket, { type: 'error', message: 'That game has already started.' });
    if (room.isFull()) return send(socket, { type: 'error', message: 'Room is full.' });
    this.leave(socket);
    room.add(socket);
  }
  public find(socket: WebSocket): Room | undefined { return [...this.rooms.values()].find(room => room.has(socket)); }
  public leave(socket: WebSocket): void {
    const room = this.find(socket);
    if (!room) return;
    room.remove(socket);
    if (room.isEmpty()) this.rooms.delete(room.code);
  }
  private makeCode(): string {
    let code = '';
    do { code = Array.from({ length: 4 }, () => LETTERS[Math.floor(Math.random() * LETTERS.length)]).join(''); } while (this.rooms.has(code));
    return code;
  }
}

const registry = RoomRegistry.getInstance();
export function createRoom(socket: WebSocket, difficulty: Difficulty): void { registry.create(socket, difficulty); }
export function joinRoom(socket: WebSocket, code: string): void { registry.join(socket, code); }
export function findRoom(socket: WebSocket): Room | undefined { return registry.find(socket); }
/** Takes the player out of their room. An empty room is deleted. */
export function leaveRoom(socket: WebSocket): void { registry.leave(socket); }
