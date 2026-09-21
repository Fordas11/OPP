import { ARENA_HEIGHT, ARENA_WIDTH } from '../shared/constants.js';
import type { Point } from '../shared/math.js';
import type { PlayerInput } from '../shared/types.js';
import { settings } from './settings.js';

const pressedKeys = new Set<string>();
const mouse: Point = { x: 0, y: 0 }; // in arena coordinates
let attackRequested = false;

export function pressKey(code: string): void {
  pressedKeys.add(code);
  if (code === settings.bindings.attack) attackRequested = true;
}

export function releaseKey(code: string): void {
  pressedKeys.delete(code);
}

export function releaseAllKeys(): void {
  pressedKeys.clear();
}

export function requestAttack(): void {
  attackRequested = true;
}

/** Remembers where the mouse is inside the arena. */
export function moveMouse(event: MouseEvent, canvas: HTMLCanvasElement): void {
  const bounds = canvas.getBoundingClientRect();
  mouse.x = ((event.clientX - bounds.left) * ARENA_WIDTH) / bounds.width;
  mouse.y = ((event.clientY - bounds.top) * ARENA_HEIGHT) / bounds.height;
}

/** Builds the input message for a player standing at `position`. */
export function readInput(position: Point): PlayerInput {
  const { bindings } = settings;
  const input: PlayerInput = {
    up: pressedKeys.has(bindings.up),
    down: pressedKeys.has(bindings.down),
    left: pressedKeys.has(bindings.left),
    right: pressedKeys.has(bindings.right),
    aim: Math.atan2(mouse.y - position.y, mouse.x - position.x),
    attack: attackRequested,
  };
  attackRequested = false;
  return input;
}
