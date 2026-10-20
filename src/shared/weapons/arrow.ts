export const ARROW_SPEED = 520; // px/s
export const MAX_BOUNCES = 3;
export const SPLIT_ANGLE = 0.45; // radians
export const SPLIT_FROM_LEVEL = 5; // bounces split arrows from this floor

/** Nested so clone() does a deep copy. */
export interface ArrowStats { damage: number; speed: number }

export interface ArrowState { id: number; x: number; y: number; angle: number; bouncesLeft: number }

let nextId = 1;

/** Prototype: every shot and split is a clone. */
export class Arrow implements ArrowState {
  public readonly id = nextId++; // unique per clone

  public constructor(
    public x = 0,
    public y = 0,
    public angle = 0,
    public bouncesLeft = MAX_BOUNCES,
    public ownerId = -1,
    public readonly stats: ArrowStats = { damage: 1, speed: ARROW_SPEED },
  ) {}

  /** Deep copy. */
  public clone(): Arrow { return new Arrow(this.x, this.y, this.angle, this.bouncesLeft, this.ownerId, structuredClone(this.stats)); }

  public launch(ownerId: number, x: number, y: number, angle: number): this {
    this.ownerId = ownerId; this.x = x; this.y = y; this.angle = angle;
    return this;
  }

  public turn(delta: number): this {
    this.angle += delta;
    return this;
  }
}

export const ARROW_PROTOTYPE = new Arrow();
