import { randomBetween, type Point } from './math.js';
import { cellCenters, startPoint } from './maze.js';
import type { Enemy } from './types.js';

const MIN_DISTANCE_FROM_START = 190;

// The four corners of a small square. All of them are inside the open start room.
const SPAWN_OFFSETS = [
  { x: -26, y: -26 },
  { x: 26, y: -26 },
  { x: -26, y: 26 },
  { x: 26, y: 26 },
];

/** Where a player stands at the start of every floor. */
export function playerSpawn(index: number): Point {
  const start = startPoint();
  const offset = SPAWN_OFFSETS[index % SPAWN_OFFSETS.length];
  return { x: start.x + offset.x, y: start.y + offset.y };
}

/** Skeletons, placed in random maze cells away from the players' start room. More players means more skeletons. */
export function createEnemies(level: number, maze: string[], playerCount: number): Enemy[] {
  const start = startPoint();
  const spots = cellCenters(maze)
    .filter(cell => Math.hypot(cell.x - start.x, cell.y - start.y) >= MIN_DISTANCE_FROM_START)
    .sort(() => Math.random() - 0.5);

  const enemies: Enemy[] = [];
  const hp = 2 + Math.floor(level / 4);

  for (let i = 0; i < level + playerCount; i++) {
    const spot = spots[i % spots.length]; // reuse cells if there are more skeletons than cells
    enemies.push({
      x: spot.x + randomBetween(-6, 6),
      y: spot.y + randomBetween(-6, 6),
      r: 16,
      hp,
      maxHp: hp,
      speed: 54 + level * 4,
      hit: 0,
      attackTimer: randomBetween(0.2, 0.9),
      wobble: Math.random() * 6,
      wanderAngle: Math.random() * Math.PI * 2,
      wanderTime: randomBetween(0.4, 1.7),
    });
  }
  return enemies;
}
