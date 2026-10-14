export const ARROW_SPEED = 520; // pixels per second
export const MAX_BOUNCES = 3; // how many times one arrow may bounce off walls
export const SPLIT_ANGLE = 0.45; // radians: how far the copy turns away from the original after a bounce
export const SPLIT_FROM_LEVEL = 5; // from this floor on, every bounce doubles the arrow

/** Numbers that describe an arrow. Kept in a separate object so clone() has something to copy deeply. */
export interface ArrowStats { damage: number; speed: number }

/** What the browsers need to draw an arrow. */
export interface ArrowState { x: number; y: number; angle: number; bouncesLeft: number }

/**
 * Prototype pattern: one ready arrow (ARROW_PROTOTYPE) is copied for every shot, and a flying arrow
 * copies itself again when it bounces on a high floor. The copy keeps everything and only the angle changes.
 */
export class Arrow implements ArrowState {
  public constructor(
    public x = 0,
    public y = 0,
    public angle = 0,
    public bouncesLeft = MAX_BOUNCES,
    public ownerId = -1,
    public readonly stats: ArrowStats = { damage: 1, speed: ARROW_SPEED },
  ) {}

  /** Deep copy: the new arrow gets its own stats object. */
  public clone(): Arrow { return new Arrow(this.x, this.y, this.angle, this.bouncesLeft, this.ownerId, structuredClone(this.stats)); }

  /** Puts a fresh copy of the prototype into the world. */
  public launch(ownerId: number, x: number, y: number, angle: number): this {
    this.ownerId = ownerId; this.x = x; this.y = y; this.angle = angle;
    return this;
  }

  /** Changes the flight direction. This is the only difference between an arrow and its split copy. */
  public turn(delta: number): this {
    this.angle += delta;
    return this;
  }
}

export const ARROW_PROTOTYPE = new Arrow();
