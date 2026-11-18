import type { WebSocket } from 'ws';
import { MAX_PLAYERS, TICK_RATE, type Difficulty } from '../shared/core/constants.js';
import { Game } from '../shared/game/game.js';
import type { ServerMessage } from '../shared/core/messages.js';
import type { GameCollection, GameIterator } from '../shared/core/iterator.js';
import type { PlayerInput } from '../shared/core/types.js';
import { WebSocketAdapter, type Connection } from './connection.js';

interface Member {
  id: number; // 0-3, also the knight color
  socket: WebSocket;
  connection: Connection;
}

/** Up to 4 players; the first one is the host. */
export class Room implements GameCollection<Member> {
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

  public createIterator(): GameIterator<Member> { return new MemberIterator(this.members); }

  public has(socket: WebSocket): boolean {
    return this.findMember(socket) !== undefined;
  }

  public add(socket: WebSocket): void {
    const id = [0, 1, 2, 3].find(free => !this.members.some(member => member.id === free))!;
    this.members.push({ id, socket, connection: new WebSocketAdapter(socket) });
    this.sendLobby();
  }

  /** Host only, before the game starts. */
  public start(socket: WebSocket): void {
    if (this.isStarted() || this.members[0]?.socket !== socket) return;
    this.begin();
  }

  public restartIfOver(): void {
    if (this.game?.state.phase === 'over') this.begin();
  }

  public handleInput(socket: WebSocket, input: PlayerInput): void {
    const member = this.findMember(socket);
    if (member) this.game?.setInput(member.id, input);
  }

  public handleCheat(socket: WebSocket, code: string): void {
    const member = this.findMember(socket);
    if (member) this.game?.cheat(member.id, code);
  }

  public handleConsole(socket: WebSocket, text: string): void {
    const member = this.findMember(socket);
    if (member && this.game) member.connection.send({ type: 'console', text: this.game.runConsole(member.id, text) });
  }

  public undoCheat(socket: WebSocket): void {
    const member = this.findMember(socket);
    if (member) this.game?.undoCheat(member.id);
  }

  /** If the host leaves the lobby, the next player becomes host. */
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
    const message: ServerMessage = { type: 'state', state: this.game.state };
    const json = JSON.stringify(message, roundNumber); // encode once for all
    const iterator = this.createIterator();
    while (iterator.hasNext()) iterator.next().connection.sendJson(json);
  }

  private findMember(socket: WebSocket): Member | undefined {
    const iterator = this.createIterator();
    while (iterator.hasNext()) {
      const member = iterator.next();
      if (member.socket === socket) return member;
    }
    return undefined;
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

/** Collection 3: room members are kept in an array. */
class MemberIterator implements GameIterator<Member> {
  private index = 0;

  public constructor(private readonly members: Member[]) {}

  public hasNext(): boolean { return this.index < this.members.length; }

  public next(): Member { return this.members[this.index++]; }
}

/** Rounds to 2 decimals for smaller messages. */
function roundNumber(_key: string, value: unknown): unknown {
  return typeof value === 'number' && !Number.isInteger(value) ? Math.round(value * 100) / 100 : value;
}

/** For sockets not in a room yet. */
export function send(socket: WebSocket, message: ServerMessage): void {
  new WebSocketAdapter(socket).send(message);
}
