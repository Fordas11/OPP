import type { Point } from '../core/math.js';
import { EnemyFactory, type EnemyKind } from '../enemies/enemyFactory.js';
import { startPoint, tileCenter } from '../maze/maze.js';
import { cellCenters } from '../maze/mazeCells.js';
import type { Enemy, IceTile } from '../core/types.js';
import { AmmoPickup, HeartPickup, ShieldPickup, type Pickup } from '../pickups/pickups.js';

const MIN_DISTANCE_FROM_START = 190;

// The four corners of a small square. All of them are inside the open start room.
const SPAWN_OFFSETS = [
  { x: -26, y: -26 },
  { x: 26, y: -26 },
  { x: -26, y: 26 },
  { x: 26, y: 26 },
];

/** Player start position. */
export function playerSpawn(index: number): Point {
  const start = startPoint();
  const offset = SPAWN_OFFSETS[index % SPAWN_OFFSETS.length];
  return { x: start.x + offset.x, y: start.y + offset.y };
}

/** Random cells away from the start; more players, more enemies. */
export function createEnemies(level: number, maze: string[], playerCount: number, hazardTiles: IceTile[] = []): Enemy[] {
  const start = startPoint();
  const spots = cellCenters(maze)
    .filter(cell => Math.hypot(cell.x - start.x, cell.y - start.y) >= MIN_DISTANCE_FROM_START)
    .filter(cell => !hazardTiles.some(tile => {
      const center = tileCenter(tile.col, tile.row);
      return cell.x === center.x && cell.y === center.y;
    }))
    .sort(() => Math.random() - 0.5);

  const enemies: Enemy[] = [];
  const factory = new EnemyFactory();
  const kinds: EnemyKind[] = ['skeleton', 'runner', 'brute'];

  for (let i = 0; i < level + playerCount; i++) {
    const spot = spots[i % spots.length]; // reuse cells if needed
    const kind = kinds[(i + level - 1) % kinds.length];
    enemies.push(factory.create(kind, spot, level));
  }
  return enemies;
}

/** Items only on plain floor: some hearts, one arrow bundle, and from floor 2 one shield. */
export function createPickups(level: number, maze: string[], specialTiles: IceTile[] = []): Pickup[] {
  const start = startPoint();
  const spots = cellCenters(maze)
    .filter(cell => Math.hypot(cell.x - start.x, cell.y - start.y) >= MIN_DISTANCE_FROM_START)
    .filter(cell => !specialTiles.some(tile => {
      const center = tileCenter(tile.col, tile.row);
      return cell.x === center.x && cell.y === center.y;
    }))
    .sort(() => Math.random() - 0.5);

  const pickups: Pickup[] = [];
  const hearts = Math.min(1 + Math.floor(level / 3), 3);
  for (let i = 0; i < hearts; i++) pickups.push(new HeartPickup(spots[i].x, spots[i].y));
  pickups.push(new AmmoPickup(spots[hearts].x, spots[hearts].y));
  if (level >= 2) pickups.push(new ShieldPickup(spots[hearts + 1].x, spots[hearts + 1].y));
  return pickups;
}
