import type { Point } from './math.js';
import { EnemyFactory, type EnemyKind } from './enemyFactory.js';
import { cellCenters, startPoint, tileCenter } from './maze.js';
import type { Enemy, HeartPickup, IceTile } from './types.js';

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
  const factory = new EnemyFactory();
  const kinds: EnemyKind[] = ['skeleton', 'runner', 'brute'];

  for (let i = 0; i < level + playerCount; i++) {
    const spot = spots[i % spots.length]; // reuse cells if there are more skeletons than cells
    const kind = kinds[(i + level - 1) % kinds.length];
    enemies.push(factory.create(kind, spot, level));
  }
  return enemies;
}

/** Hearts only appear on ordinary floor, never on a hazard or healing tile. */
export function createHearts(level: number, maze: string[], specialTiles: IceTile[] = []): HeartPickup[] {
  const start = startPoint();
  const spots = cellCenters(maze)
    .filter(cell => Math.hypot(cell.x - start.x, cell.y - start.y) >= MIN_DISTANCE_FROM_START)
    .filter(cell => !specialTiles.some(tile => {
      const center = tileCenter(tile.col, tile.row);
      return cell.x === center.x && cell.y === center.y;
    }))
    .sort(() => Math.random() - 0.5);
  return spots.slice(0, Math.min(1 + Math.floor(level / 3), 3)).map(spot => ({ x: spot.x, y: spot.y, amount: 2 }));
}
