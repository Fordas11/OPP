import { clamp, type Point } from './math.js';
import type { IceTile } from './types.js';

// The dungeon is a grid of square tiles. Each row of the maze is a string:
// '#' is a wall tile and '.' is a floor tile.
export const TILE = 48;
export const MAZE_COLS = 19;
export const MAZE_ROWS = 11;
export const MAZE_LEFT = 24; // where the maze starts on the canvas
export const MAZE_TOP = 60;

const CENTER_COL = (MAZE_COLS - 1) / 2;
const CENTER_ROW = (MAZE_ROWS - 1) / 2;
const EXTRA_OPENINGS = 0.3; // chance to knock out a wall, so the maze has loops

export function tileCenter(col: number, row: number): Point {
  return { x: MAZE_LEFT + col * TILE + TILE / 2, y: MAZE_TOP + row * TILE + TILE / 2 };
}

/** Anything outside the grid counts as wall. */
export function isWall(maze: string[], col: number, row: number): boolean {
  return maze[row]?.[col] !== '.';
}

export function isWallAt(maze: string[], x: number, y: number): boolean {
  return isWall(maze, Math.floor((x - MAZE_LEFT) / TILE), Math.floor((y - MAZE_TOP) / TILE));
}

/** True when a circle at (x, y) with radius r overlaps a wall tile. */
export function hitsWall(maze: string[], x: number, y: number, r: number): boolean {
  const firstCol = Math.floor((x - r - MAZE_LEFT) / TILE);
  const lastCol = Math.floor((x + r - MAZE_LEFT) / TILE);
  const firstRow = Math.floor((y - r - MAZE_TOP) / TILE);
  const lastRow = Math.floor((y + r - MAZE_TOP) / TILE);

  for (let row = firstRow; row <= lastRow; row++) {
    for (let col = firstCol; col <= lastCol; col++) {
      if (!isWall(maze, col, row)) continue;
      const left = MAZE_LEFT + col * TILE;
      const top = MAZE_TOP + row * TILE;
      const closestX = clamp(x, left, left + TILE);
      const closestY = clamp(y, top, top + TILE);
      if (Math.hypot(x - closestX, y - closestY) < r) return true;
    }
  }
  return false;
}

/** The middle of the maze, where the players start each floor. */
export function startPoint(): Point {
  return tileCenter(CENTER_COL, CENTER_ROW);
}

/** Centers of the maze cells (not the wall gaps between them). */
export function cellCenters(maze: string[]): Point[] {
  const cells: Point[] = [];
  for (let row = 1; row < MAZE_ROWS; row += 2) {
    for (let col = 1; col < MAZE_COLS; col += 2) {
      if (!isWall(maze, col, row)) cells.push(tileCenter(col, row));
    }
  }
  return cells;
}

/** Product assembled step by step by a builder. */
export interface MazeBuilder {
  createEmptyGrid(): void;
  carvePaths(): void;
  addExtraOpenings(): void;
  addStartRoom(): void;
  addSpecialTiles(): void;
  getResult(): MazeLayout;
}
export type MazeVariant = 'classic' | 'ice-healing' | 'ice' | 'fire-ice-healing' | 'fire-ice' | 'fire' | 'garden';
export interface MazeLayout { tiles: string[]; iceTiles: IceTile[]; fireTiles: IceTile[]; healingTiles: IceTile[]; }

abstract class BaseMazeBuilder implements MazeBuilder {
  protected wall: boolean[][] = [];
  protected iceTiles: IceTile[] = [];
  protected fireTiles: IceTile[] = [];
  protected healingTiles: IceTile[] = [];
  public createEmptyGrid(): void { this.wall = Array.from({ length: MAZE_ROWS }, () => Array<boolean>(MAZE_COLS).fill(true)); }
  public carvePaths(): void { carveCorridors(this.wall); }
  public abstract addExtraOpenings(): void;
  public addStartRoom(): void { openStartRoom(this.wall); }
  public addSpecialTiles(): void { /* Default floor has no hazards. */ }
  public getResult(): MazeLayout { return { tiles: this.wall.map(row => row.map(isSolid => (isSolid ? '#' : '.')).join('')), iceTiles: this.iceTiles, fireTiles: this.fireTiles, healingTiles: this.healingTiles }; }
}

/** Concrete Builder 1: the original dungeon with a moderate number of loops. */
export class ClassicMazeBuilder extends BaseMazeBuilder {
  public addExtraOpenings(): void { openExtraWalls(this.wall, EXTRA_OPENINGS); }
}

/** Concrete Builder 2: a more open maze, used for frost floors. */
export class OpenMazeBuilder extends BaseMazeBuilder {
  public addExtraOpenings(): void { openExtraWalls(this.wall, 0.58); }
  /** Builder-only job: decide which floor cells become ice. */
  public override addSpecialTiles(): void {
    for (let row = 1; row < MAZE_ROWS - 1; row += 2) for (let col = 1; col < MAZE_COLS - 1; col += 2) {
      const outsideStart = Math.abs(col - CENTER_COL) > 1 || Math.abs(row - CENTER_ROW) > 1;
      if (outsideStart && !this.wall[row][col] && Math.random() < 0.28) this.iceTiles.push({ col, row });
    }
  }
}

export class IceHealingMazeBuilder extends OpenMazeBuilder {
  public override addSpecialTiles(): void { super.addSpecialTiles(); this.healingTiles = chooseSpecialTiles(this.wall, 0.18); }
}

/** Concrete Builder 3: lava floor; stepping on a flame is immediately fatal. */
export class FireMazeBuilder extends BaseMazeBuilder {
  public addExtraOpenings(): void { openExtraWalls(this.wall, 0.18); }
  public override addSpecialTiles(): void { this.fireTiles = chooseSpecialTiles(this.wall, 0.22); }
}

export class FireIceMazeBuilder extends FireMazeBuilder {
  public override addSpecialTiles(): void { super.addSpecialTiles(); this.iceTiles = chooseSpecialTiles(this.wall, 0.2); }
}
export class FireIceHealingMazeBuilder extends FireIceMazeBuilder {
  public override addSpecialTiles(): void { super.addSpecialTiles(); this.healingTiles = chooseSpecialTiles(this.wall, 0.14); }
}

/** Concrete Builder 4: a calmer garden with healing grass patches. */
export class GardenMazeBuilder extends BaseMazeBuilder {
  public addExtraOpenings(): void { openExtraWalls(this.wall, 0.45); }
  public override addSpecialTiles(): void { this.healingTiles = chooseSpecialTiles(this.wall, 0.25); }
}

/** Director knows the construction order; it does not know a builder's implementation. */
export class MazeDirector {
  public construct(builder: MazeBuilder): MazeLayout {
    builder.createEmptyGrid();
    builder.carvePaths();
    builder.addExtraOpenings();
    builder.addStartRoom();
    builder.addSpecialTiles();
    return builder.getResult();
  }
}

export function createMazeLayout(variant: MazeVariant = 'classic'): MazeLayout {
  const builders: Record<MazeVariant, MazeBuilder> = {
    classic: new ClassicMazeBuilder(), ice: new OpenMazeBuilder(), 'ice-healing': new IceHealingMazeBuilder(),
    fire: new FireMazeBuilder(), 'fire-ice': new FireIceMazeBuilder(), 'fire-ice-healing': new FireIceHealingMazeBuilder(), garden: new GardenMazeBuilder(),
  };
  return new MazeDirector().construct(builders[variant]);
}
export function isIceAt(iceTiles: IceTile[], x: number, y: number): boolean {
  const col = Math.floor((x - MAZE_LEFT) / TILE);
  const row = Math.floor((y - MAZE_TOP) / TILE);
  return iceTiles.some(tile => tile.col === col && tile.row === row);
}

function chooseSpecialTiles(wall: boolean[][], chance: number): IceTile[] {
  const tiles: IceTile[] = [];
  for (let row = 1; row < MAZE_ROWS - 1; row += 2) for (let col = 1; col < MAZE_COLS - 1; col += 2) {
    const outsideStart = Math.abs(col - CENTER_COL) > 1 || Math.abs(row - CENTER_ROW) > 1;
    if (outsideStart && !wall[row][col] && Math.random() < chance) tiles.push({ col, row });
  }
  return tiles;
}

/** Random walk that visits every cell once. Cells sit on odd rows and columns. */
function carveCorridors(wall: boolean[][]): void {
  const steps = [[2, 0], [-2, 0], [0, 2], [0, -2]];
  const path = [{ col: 1, row: 1 }];
  wall[1][1] = false;

  while (path.length > 0) {
    const here = path[path.length - 1];
    const options = steps.filter(([dc, dr]) => {
      const col = here.col + dc;
      const row = here.row + dr;
      return col >= 1 && col < MAZE_COLS - 1 && row >= 1 && row < MAZE_ROWS - 1 && wall[row][col];
    });

    if (options.length === 0) {
      path.pop(); // dead end, step back
      continue;
    }
    const [dc, dr] = options[Math.floor(Math.random() * options.length)];
    wall[here.row + dr / 2][here.col + dc / 2] = false; // the gap between two cells
    wall[here.row + dr][here.col + dc] = false;
    path.push({ col: here.col + dc, row: here.row + dr });
  }
}

/** Knocks out some inner walls between two cells, so there is more than one route. */
function openExtraWalls(wall: boolean[][], chance: number): void {
  for (let row = 1; row < MAZE_ROWS - 1; row++) {
    for (let col = 1; col < MAZE_COLS - 1; col++) {
      const isGapBetweenCells = (row + col) % 2 === 1;
      if (isGapBetweenCells && wall[row][col] && Math.random() < chance) wall[row][col] = false;
    }
  }
}

function openStartRoom(wall: boolean[][]): void {
  for (let row = CENTER_ROW - 1; row <= CENTER_ROW + 1; row++) {
    for (let col = CENTER_COL - 1; col <= CENTER_COL + 1; col++) wall[row][col] = false;
  }
}
