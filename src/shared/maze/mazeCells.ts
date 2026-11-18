import type { Point } from '../core/math.js';
import type { GameCollection, GameIterator } from '../core/iterator.js';
import { isWall, MAZE_COLS, MAZE_ROWS, tileCenter } from './maze.js';

/** Collection 1: floor cells of the maze grid (string[], read as a 2D grid). */
export class MazeCells implements GameCollection<Point> {
  public constructor(private readonly maze: string[]) {}
  public createIterator(): GameIterator<Point> { return new MazeCellIterator(this.maze); }
}

/** Walks odd rows and columns and skips walls. */
class MazeCellIterator implements GameIterator<Point> {
  private col = 1;
  private row = 1;

  public constructor(private readonly maze: string[]) { this.skipWalls(); }

  public hasNext(): boolean { return this.row < MAZE_ROWS; }

  public next(): Point {
    const cell = tileCenter(this.col, this.row);
    this.step();
    this.skipWalls();
    return cell;
  }

  private step(): void {
    this.col += 2;
    if (this.col >= MAZE_COLS) {
      this.col = 1;
      this.row += 2;
    }
  }

  private skipWalls(): void {
    while (this.hasNext() && isWall(this.maze, this.col, this.row)) this.step();
  }
}

/** Cell centers (odd rows and columns). */
export function cellCenters(maze: string[]): Point[] {
  const cells: Point[] = [];
  const iterator = new MazeCells(maze).createIterator();
  while (iterator.hasNext()) cells.push(iterator.next());
  return cells;
}
