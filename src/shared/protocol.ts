export type Difficulty = 'calm' | 'standard' | 'brutal';

export interface Vector2 { x: number; y: number; }
export interface PlayerSnapshot { id: string; position: Vector2; aim: number; health: number; }
export interface GameSnapshot { roomId: string; level: number; players: PlayerSnapshot[]; }

export type ClientMessage =
  | { type: 'join-room'; roomId: string; playerId: string }
  | { type: 'input'; sequence: number; move: Vector2; attack: boolean }
  | { type: 'leave-room'; roomId: string; playerId: string };

export type ServerMessage =
  | { type: 'room-state'; snapshot: GameSnapshot }
  | { type: 'error'; message: string };

/** Adapter pattern: isolates JSON transport details from game classes. */
export class JsonProtocolAdapter {
  public encode(message: ClientMessage | ServerMessage): string { return JSON.stringify(message); }

  public decode(payload: string): ClientMessage | ServerMessage {
    const value: unknown = JSON.parse(payload);
    if (!value || typeof value !== 'object' || !('type' in value)) throw new Error('Invalid game message.');
    return value as ClientMessage | ServerMessage;
  }
}
