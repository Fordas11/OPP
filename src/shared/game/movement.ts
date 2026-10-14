import { distance, type Point } from '../core/math.js';
import { hitsWall, isWallAt } from '../maze/maze.js';

interface Body extends Point {
  r: number;
}

/** Moves a body, sliding along walls instead of stopping dead. */
export function moveBody(body: Body, dx: number, dy: number, maze: string[]): void {
  if (!hitsWall(maze, body.x + dx, body.y, body.r)) body.x += dx;
  if (!hitsWall(maze, body.x, body.y + dy, body.r)) body.y += dy;
}

/** True when a straight line from `from` to `to` does not cross a wall. */
export function hasClearLine(from: Point, to: Point, maze: string[]): boolean {
  const steps = Math.ceil(distance(from, to) / 6);
  for (let i = 1; i < steps; i++) {
    const progress = i / steps;
    if (isWallAt(maze, from.x + (to.x - from.x) * progress, from.y + (to.y - from.y) * progress)) return false;
  }
  return true;
}

/** True when `to` is within `sight` of `from` and no wall is in between. */
export function canSee(from: Point, to: Point, sight: number, maze: string[]): boolean {
  return distance(from, to) <= sight && hasClearLine(from, to, maze);
}
