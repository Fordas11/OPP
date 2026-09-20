import type { Vector2 } from '../shared/protocol';
import { Skeleton } from './entities';

export interface EnemyContext { player: Vector2; sightDistance: number; move(enemy: Skeleton, vector: Vector2): void; canSee(enemy: Skeleton): boolean; }
export interface SkeletonStrategy { readonly name: string; update(enemy: Skeleton, context: EnemyContext, deltaSeconds: number): SkeletonStrategy; }

export class IdleStrategy implements SkeletonStrategy {
  public readonly name = 'idle';
  public update(enemy: Skeleton, context: EnemyContext): SkeletonStrategy { return context.canSee(enemy) ? new ChaseStrategy() : new WanderStrategy(); }
}

export class WanderStrategy implements SkeletonStrategy {
  public readonly name = 'wander';
  public update(enemy: Skeleton, context: EnemyContext, deltaSeconds: number): SkeletonStrategy {
    if (context.canSee(enemy)) return new ChaseStrategy();
    const angle = (enemy.id.length * 1.7 + performance.now() / 900) % (Math.PI * 2);
    context.move(enemy, { x: Math.cos(angle) * 24 * deltaSeconds, y: Math.sin(angle) * 24 * deltaSeconds });
    return this;
  }
}

export class ChaseStrategy implements SkeletonStrategy {
  public readonly name = 'chase';
  public update(enemy: Skeleton, context: EnemyContext, deltaSeconds: number): SkeletonStrategy {
    if (!context.canSee(enemy)) return new WanderStrategy();
    const dx = context.player.x - enemy.position.x, dy = context.player.y - enemy.position.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 40) return new AttackStrategy();
    context.move(enemy, { x: dx / distance * 64 * deltaSeconds, y: dy / distance * 64 * deltaSeconds });
    return this;
  }
}

export class AttackStrategy implements SkeletonStrategy {
  public readonly name = 'attack';
  public update(enemy: Skeleton, context: EnemyContext): SkeletonStrategy {
    const distance = Math.hypot(context.player.x - enemy.position.x, context.player.y - enemy.position.y);
    return distance > 48 ? new ChaseStrategy() : this;
  }
}
