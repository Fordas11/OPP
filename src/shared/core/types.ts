import type { ArrowState } from '../weapons/arrow.js';

export interface Player {
  id: number; // 0-3
  x: number;
  y: number;
  r: number;
  hp: number;
  maxHp: number;
  aim: number; // radians, towards the mouse
  attack: number; // swing time left
  cooldown: number;
  hurt: number; // invulnerability time left
  speed: number;
  environmentTimer: number; // until the next ice or healing tick
  kills: number;
  weapon: WeaponInfo;
  ammo: number; // refilled every floor
  maxAmmo: number;
  godMode: boolean;
  cheatText: string; // shown above the knight
  cheatTimer: number;
  inputSeq: number; // last movement step done by the server
}

export interface WeaponInfo {
  name: string; // e.g. "Sharp Long Sword"
  damage: number;
  reach: number;
}

export interface Enemy {
  id: number; // for interpolation
  kind: 'skeleton' | 'runner' | 'brute';
  x: number;
  y: number;
  r: number;
  hp: number;
  maxHp: number;
  speed: number;
  hit: number; // hit flash time left
  attackTimer: number;
  wobble: number;
  wanderAngle: number;
  wanderTime: number;
}

export interface IceTile { col: number; row: number; }
export interface HeartPickup { x: number; y: number; amount: number; }

/** A particle burst. */
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
  maze: string[]; // '#' wall, '.' floor
  iceTiles: IceTile[];
  fireTiles: IceTile[];
  healingTiles: IceTile[];
  hearts: HeartPickup[];
  effects: Effect[];
  arrows: ArrowState[];
  theme: 'crypt' | 'frost' | 'fire' | 'garden';
  themeVisuals: { wallColor: string; enemyColor: string };
  enemiesFrozen: boolean;
}

/** Sent by the browser every tick. */
export interface PlayerInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  aim: number;
  attack: boolean;
  shoot: boolean;
  seq: number; // movement step number
}
