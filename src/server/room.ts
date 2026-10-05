import type { WebSocket } from 'ws';
import { MAX_PLAYERS, TICK_RATE, type Difficulty } from '../shared/constants.js';
import { Game } from '../shared/game.js';
import type { ServerMessage } from '../shared/messages.js';
import type { PlayerInput } from '../shared/types.js';
import { WebSocketAdapter, type Connection } from './connection.js';

interface Member {
  id: number; // 0 to 3, also decides the knight's color
  socket: WebSocket;
  connection: Connection; // adapter around the socket
}

/** A room holds up to four players. The first one is the host and starts the game. */
export class Room {
  private readonly members: Member[] = [];
  private game: Game | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;

  public constructor(public readonly code: string, private readonly difficulty: Difficulty) {}

  public isFull(): boolean {
    return this.members.length >= MAX_PLAYERS;
  }

  public isStarted(): boolean {
    return this.game !== null;
  }

  public isEmpty(): boolean {
    return this.members.length === 0;
  }

  public has(socket: WebSocket): boolean {
    return this.members.some(member => member.socket === socket);
  }

  public add(socket: WebSocket): void {
    const id = [0, 1, 2, 3].find(free => !this.members.some(member => member.id === free))!;
    this.members.push({ id, socket, connection: new WebSocketAdapter(socket) });
    this.sendLobby();
  }

  /** Only the host can start, and only while the room is still waiting. */
  public start(socket: WebSocket): void {
    if (this.isStarted() || this.members[0]?.socket !== socket) return;
    this.begin();
  }

  public restartIfOver(): void {
    if (this.game?.state.phase === 'over') this.begin();
  }

  public handleInput(socket: WebSocket, input: PlayerInput): void {
    const member = this.members.find(m => m.socket === socket);
    if (member) this.game?.setInput(member.id, input);
  }

  /** The others keep playing. If the host leaves before the start, the next player becomes host. */
  public remove(socket: WebSocket): void {
    const index = this.members.findIndex(member => member.socket === socket);
    if (index === -1) return;

    const [left] = this.members.splice(index, 1);
    this.game?.removePlayer(left.id);

    if (this.isEmpty()) this.stopTimer();
    else if (!this.isStarted()) this.sendLobby();
  }

  private begin(): void {
    this.stopTimer();
    this.game = new Game(this.difficulty, this.members.map(member => member.id));
    for (const member of this.members) member.connection.send({ type: 'game-started', you: member.id });
    this.timer = setInterval(() => this.tick(), 1000 / TICK_RATE);
  }

  private tick(): void {
    if (!this.game) return;
    this.game.update(1 / TICK_RATE);
    for (const member of this.members) member.connection.send({ type: 'state', state: this.game.state, adapterSent: member.connection.sent });
  }

  private sendLobby(): void {
    this.members.forEach((member, index) => {
      member.connection.send({
        type: 'lobby',
        code: this.code,
        players: this.members.length,
        isHost: index === 0,
      });
    });
  }

  private stopTimer(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}

/** For sockets that are not in a room yet (for example "Room not found"). */
export function send(socket: WebSocket, message: ServerMessage): void {
  new WebSocketAdapter(socket).send(message);
}
