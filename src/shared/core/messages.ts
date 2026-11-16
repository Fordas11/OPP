import type { Difficulty } from './constants.js';
import type { GameState, PlayerInput } from './types.js';

/** Browser to server. */
export type ClientMessage =
  | { type: 'create-room'; difficulty: Difficulty }
  | { type: 'join-room'; code: string }
  | { type: 'start-game' } // host only
  | { type: 'input'; input: PlayerInput }
  | { type: 'cheat'; code: string } // e.g. "kkk"
  | { type: 'undo-cheat' } // Ctrl+Z
  | { type: 'console'; text: string } // e.g. "spawn runner 2; heal"
  | { type: 'restart' };

/** Server to browser. */
export type ServerMessage =
  | { type: 'lobby'; code: string; players: number; isHost: boolean }
  | { type: 'game-started'; you: number }
  | { type: 'state'; state: GameState }
  | { type: 'console'; text: string } // answer to a console command
  | { type: 'error'; message: string };
