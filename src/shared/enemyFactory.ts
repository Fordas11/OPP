import { randomBetween, type Point } from './math.js';
import type { Enemy } from './types.js';

/** Factory pattern: one place creates all three concrete enemy products. */
export type EnemyKind = Enemy['kind'];

abstract class EnemyProduct {
  public abstract readonly kind: EnemyKind;
  protected abstract readonly radius: number;
  protected abstract readonly baseHp: number;
  protected abstract readonly baseSpeed: number;

  public create(position: Point, level: number): Enemy {
    const hp = this.baseHp + Math.floor(level / 4);
    return {
      kind: this.kind, x: position.x + randomBetween(-6, 6), y: position.y + randomBetween(-6, 6),
      r: this.radius, hp, maxHp: hp, speed: this.baseSpeed + level * 4,
      hit: 0, attackTimer: randomBetween(0.2, 0.9), wobble: Math.random() * 6,
      wanderAngle: Math.random() * Math.PI * 2, wanderTime: randomBetween(0.4, 1.7),
    };
  }
}

export class SkeletonEnemy extends EnemyProduct { public readonly kind = 'skeleton' as const; protected readonly radius = 16; protected readonly baseHp = 2; protected readonly baseSpeed = 54; }
export class RunnerEnemy extends EnemyProduct { public readonly kind = 'runner' as const; protected readonly radius = 13; protected readonly baseHp = 1; protected readonly baseSpeed = 78; }
export class BruteEnemy extends EnemyProduct { public readonly kind = 'brute' as const; protected readonly radius = 21; protected readonly baseHp = 4; protected readonly baseSpeed = 38; }

export class EnemyFactory {
  private readonly products: Record<EnemyKind, EnemyProduct> = {
    skeleton: new SkeletonEnemy(), runner: new RunnerEnemy(), brute: new BruteEnemy(),
  };
  public create(kind: EnemyKind, position: Point, level: number): Enemy { return this.products[kind].create(position, level); }
}
