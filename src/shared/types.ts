export interface Player {
  id: number; // 0 or 1
  x: number;
  y: number;
  r: number;
  hp: number;
  maxHp: number;
  aim: number; // angle towards the mouse
  attack: number; // time left of the sword swing animation
  cooldown: number;
  hurt: number; // time left of the invulnerability after a hit
  speed: number;
}

export interface Enemy {
  x: number;
  y: number;
  r: number;
  hp: number;
  maxHp: number;
  speed: number;
  hit: number; // time left of the "just hit" flash
  attackTimer: number;
  wobble: number;
  wanderAngle: number;
  wanderTime: number;
}

/** A small burst of particles the client should show. */
export interface Effect {
  x: number;
  y: number;
  color: string;
  amount: number;
}

export interface GameState {
  level: number;
  phase: 'playing' | 'over';
  banner: number;
  players: Player[];
  enemies: Enemy[];
  maze: string[]; // rows of '#' (wall) and '.' (floor)
  effects: Effect[];
}

/** What a client tells the server about its player every tick. */
export interface PlayerInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  aim: number;
  attack: boolean;
}
