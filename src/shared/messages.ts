import type { Difficulty } from './constants.js';
import type { GameState, PlayerInput } from './types.js';

/** Messages sent from the browser to the server (as JSON). */
export type ClientMessage =
  | { type: 'create-room'; difficulty: Difficulty }
  | { type: 'join-room'; code: string }
  | { type: 'start-game' } // only the host (first player in the room) can do this
  | { type: 'input'; input: PlayerInput }
  | { type: 'restart' };

/** Messages sent from the server to the browser (as JSON). */
export type ServerMessage =
  // Sent to everyone in the room while it waits for players.
  | { type: 'lobby'; code: string; players: number; isHost: boolean }
  | { type: 'game-started'; you: number }
  | { type: 'state'; state: GameState; adapterSent: number } // adapterSent: messages sent to this player so far
  | { type: 'error'; message: string };
