import { distance, type Point } from '../core/math.js';
import type { PlayerInput } from '../core/types.js';
import { hitsWall, isWallAt } from '../maze/maze.js';

interface Body extends Point {
  r: number;
}

export type MoveKeys = Pick<PlayerInput, 'up' | 'down' | 'left' | 'right'>;

/** Moves a body, sliding along walls. */
export function moveBody(body: Body, dx: number, dy: number, maze: string[]): void {
  if (!hitsWall(maze, body.x + dx, body.y, body.r)) body.x += dx;
  if (!hitsWall(maze, body.x, body.y + dy, body.r)) body.y += dy;
}

/** One knight step. Shared by the server and client prediction. */
export function movePlayer(player: Body & { speed: number }, keys: MoveKeys, dt: number, maze: string[], enemies: Body[]): void {
  const dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  const dy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
  if (!dx && !dy) return;

  const length = Math.hypot(dx, dy);
  const old = { x: player.x, y: player.y };
  moveBody(player, (dx / length) * player.speed * dt, (dy / length) * player.speed * dt, maze);
  // Can't walk into an enemy, but can always step away.
  const blocked = enemies.some(enemy => {
    const now = distance(player, enemy);
    return now < player.r + enemy.r && now < distance(old, enemy);
  });
  if (blocked) { player.x = old.x; player.y = old.y; }
}

/** No wall between the two points. */
export function hasClearLine(from: Point, to: Point, maze: string[]): boolean {
  const steps = Math.ceil(distance(from, to) / 6);
  for (let i = 1; i < steps; i++) {
    const progress = i / steps;
    if (isWallAt(maze, from.x + (to.x - from.x) * progress, from.y + (to.y - from.y) * progress)) return false;
  }
  return true;
}

/** Within `sight` and no wall between. */
export function canSee(from: Point, to: Point, sight: number, maze: string[]): boolean {
  return distance(from, to) <= sight && hasClearLine(from, to, maze);
}
