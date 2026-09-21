import { clamp, type Point } from './math.js';

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

/**
 * Builds a new random maze. Every floor tile can be reached from every other one,
 * and the middle always has a small open room for the players.
 */
export function createMaze(): string[] {
  const wall = Array.from({ length: MAZE_ROWS }, () => Array<boolean>(MAZE_COLS).fill(true));
  carveCorridors(wall);
  openExtraWalls(wall);
  openStartRoom(wall);
  return wall.map(row => row.map(isSolid => (isSolid ? '#' : '.')).join(''));
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
function openExtraWalls(wall: boolean[][]): void {
  for (let row = 1; row < MAZE_ROWS - 1; row++) {
    for (let col = 1; col < MAZE_COLS - 1; col++) {
      const isGapBetweenCells = (row + col) % 2 === 1;
      if (isGapBetweenCells && wall[row][col] && Math.random() < EXTRA_OPENINGS) wall[row][col] = false;
    }
  }
}

function openStartRoom(wall: boolean[][]): void {
  for (let row = CENTER_ROW - 1; row <= CENTER_ROW + 1; row++) {
    for (let col = CENTER_COL - 1; col <= CENTER_COL + 1; col++) wall[row][col] = false;
  }
}
