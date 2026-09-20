export class IdleStrategy {
    name = 'idle';
    update(enemy, context) { return context.canSee(enemy) ? new ChaseStrategy() : new WanderStrategy(); }
}
export class WanderStrategy {
    name = 'wander';
    update(enemy, context, deltaSeconds) {
        if (context.canSee(enemy))
            return new ChaseStrategy();
        const angle = (enemy.id.length * 1.7 + performance.now() / 900) % (Math.PI * 2);
        context.move(enemy, { x: Math.cos(angle) * 24 * deltaSeconds, y: Math.sin(angle) * 24 * deltaSeconds });
        return this;
    }
}
export class ChaseStrategy {
    name = 'chase';
    update(enemy, context, deltaSeconds) {
        if (!context.canSee(enemy))
            return new WanderStrategy();
        const dx = context.player.x - enemy.position.x, dy = context.player.y - enemy.position.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 40)
            return new AttackStrategy();
        context.move(enemy, { x: dx / distance * 64 * deltaSeconds, y: dy / distance * 64 * deltaSeconds });
        return this;
    }
}
export class AttackStrategy {
    name = 'attack';
    update(enemy, context) {
        const distance = Math.hypot(context.player.x - enemy.position.x, context.player.y - enemy.position.y);
        return distance > 48 ? new ChaseStrategy() : this;
    }
}
