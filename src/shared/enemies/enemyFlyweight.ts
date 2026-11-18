import type { Enemy } from '../core/types.js';
import type { EnemyKind } from './enemyFactory.js';

/** Flyweight: data that is the same for all enemies of one kind on one floor. */
export class EnemyType {
  public constructor(
    public readonly kind: EnemyKind,
    public readonly radius: number,
    public readonly maxHp: number,
    public readonly speed: number,
  ) {}
}

/** Flyweight factory: gives back an existing EnemyType or makes a new one. */
export class EnemyTypeFactory {
  private static readonly types = new Map<string, EnemyType>();

  public static getType(kind: EnemyKind, radius: number, maxHp: number, speed: number): EnemyType {
    const key = `${kind}-${maxHp}-${speed}`;
    let type = this.types.get(key);
    if (!type) {
      type = new EnemyType(kind, radius, maxHp, speed);
      this.types.set(key, type);
    }
    return type;
  }

  public static count(): number {
    return this.types.size;
  }
}

/** One enemy in the maze: only its own data plus a link to the shared EnemyType. */
export class EnemyInstance implements Enemy {
  public hit = 0;

  public constructor(
    public readonly id: number,
    public x: number,
    public y: number,
    public hp: number,
    public attackTimer: number,
    public wobble: number,
    public wanderAngle: number,
    public wanderTime: number,
    private readonly type: EnemyType,
  ) {}

  public get kind(): EnemyKind { return this.type.kind; }
  public get r(): number { return this.type.radius; }
  public get maxHp(): number { return this.type.maxHp; }
  public get speed(): number { return this.type.speed; }

  /** The browser gets the same JSON as before. */
  public toJSON(): Enemy {
    return {
      id: this.id, kind: this.kind, x: this.x, y: this.y, r: this.r, hp: this.hp, maxHp: this.maxHp, speed: this.speed,
      hit: this.hit, attackTimer: this.attackTimer, wobble: this.wobble, wanderAngle: this.wanderAngle, wanderTime: this.wanderTime,
    };
  }
}
