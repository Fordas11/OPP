export const ARENA_WIDTH = 960;
export const ARENA_HEIGHT = 600;
export const TICK_RATE = 30;
export const MAX_PLAYERS = 4;
export const SWING_TIME = 0.22; // how long a sword swing lasts, in seconds

export const DIFFICULTIES = {
  calm: { sight: 180, damage: 1 },
  standard: { sight: 250, damage: 1 },
  brutal: { sight: 340, damage: 2 },
};

export type Difficulty = keyof typeof DIFFICULTIES;

export function isDifficulty(value: unknown): value is Difficulty {
  return typeof value === 'string' && value in DIFFICULTIES;
}
