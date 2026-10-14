import { distance, randomBetween } from '../core/math.js';
import { moveBody } from '../game/movement.js';
import type { Enemy, Player } from '../core/types.js';

export interface EnemyStrategyContext { readonly maze: string[]; readonly target?: Player; readonly dt: number; }
export interface EnemyStrategy { move(enemy: Enemy, context: EnemyStrategyContext): void; }

/** Four interchangeable movement algorithms used by Game.updateEnemy(). */
export class ChaseStrategy implements EnemyStrategy {
  public move(enemy: Enemy, { target, maze, dt }: EnemyStrategyContext): void {
    if (!target) return;
    const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
    if (distance(target, enemy) > 38) moveBody(enemy, Math.cos(angle) * enemy.speed * dt, Math.sin(angle) * enemy.speed * dt, maze);
  }
}
export class RetreatStrategy implements EnemyStrategy {
  public move(enemy: Enemy, { target, maze, dt }: EnemyStrategyContext): void {
    if (!target) return;
    const angle = Math.atan2(enemy.y - target.y, enemy.x - target.x);
    // Runner keeps distance, but starts advancing if it is already far away.
    const direction = distance(target, enemy) < 105 ? 1 : -0.55;
    moveBody(enemy, Math.cos(angle) * enemy.speed * direction * dt, Math.sin(angle) * enemy.speed * direction * dt, maze);
  }
}
export class CircleStrategy implements EnemyStrategy {
  public move(enemy: Enemy, { target, maze, dt }: EnemyStrategyContext): void {
    if (!target) return;
    const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x) + Math.PI / 2;
    moveBody(enemy, Math.cos(angle) * enemy.speed * 0.7 * dt, Math.sin(angle) * enemy.speed * 0.7 * dt, maze);
  }
}
export class WanderStrategy implements EnemyStrategy {
  public move(enemy: Enemy, { maze, dt }: EnemyStrategyContext): void {
    enemy.wanderTime -= dt;
    if (enemy.wanderTime <= 0) { enemy.wanderAngle = Math.random() * Math.PI * 2; enemy.wanderTime = randomBetween(0.55, 1.8); }
    const oldX = enemy.x; const oldY = enemy.y;
    moveBody(enemy, Math.cos(enemy.wanderAngle) * enemy.speed * 0.48 * dt, Math.sin(enemy.wanderAngle) * enemy.speed * 0.48 * dt, maze);
    if (enemy.x === oldX && enemy.y === oldY) enemy.wanderTime = 0;
  }
}

const chase = new ChaseStrategy(); const retreat = new RetreatStrategy(); const circle = new CircleStrategy(); const wander = new WanderStrategy();
export function strategyFor(enemy: Enemy, target?: Player): EnemyStrategy {
  if (!target) return wander;
  if (enemy.kind === 'runner') return retreat;
  if (enemy.kind === 'brute') return circle;
  return chase;
}
