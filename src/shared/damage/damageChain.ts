import type { Player } from '../core/types.js';

/** A skeleton hits a knight. */
export interface Hit {
  victim: Player;
  amount: number;
}

/** What happened to the hit. */
export type HitOutcome = 'ignored' | 'shield-broken' | 'damaged';

const HURT_TIME = 0.58; // seconds of invulnerability after a hit

/**
 * Chain of Responsibility: a hit goes through a chain of rules.
 * Each handler either deals with the hit (and the chain stops) or passes it on.
 */
export abstract class DamageHandler {
  private next: DamageHandler | null = null;

  /** Returns `next`, so the chain can be written in one line. */
  public setNext(next: DamageHandler): DamageHandler {
    this.next = next;
    return next;
  }

  public handle(hit: Hit): HitOutcome {
    return this.tryHandle(hit) ?? this.next?.handle(hit) ?? 'ignored';
  }

  /** The outcome if this handler stops the hit, otherwise `null`. */
  protected abstract tryHandle(hit: Hit): HitOutcome | null;
}

/** 1. God mode: no damage at all. */
export class GodModeHandler extends DamageHandler {
  protected tryHandle(hit: Hit): HitOutcome | null {
    return hit.victim.godMode ? 'ignored' : null;
  }
}

/** 2. Just hit: a short invulnerability, so one skeleton cannot hit every tick. */
export class InvulnerabilityHandler extends DamageHandler {
  protected tryHandle(hit: Hit): HitOutcome | null {
    return hit.victim.hurt > 0 ? 'ignored' : null;
  }
}

/** 3. Shield: blocks the hit and loses one charge. */
export class ShieldHandler extends DamageHandler {
  protected tryHandle(hit: Hit): HitOutcome | null {
    if (hit.victim.shield <= 0) return null;
    hit.victim.shield--;
    hit.victim.hurt = HURT_TIME;
    return 'shield-broken';
  }
}

/** 4. Last link: the knight loses health. */
export class HealthHandler extends DamageHandler {
  protected tryHandle(hit: Hit): HitOutcome | null {
    hit.victim.hp -= hit.amount;
    hit.victim.hurt = HURT_TIME;
    return 'damaged';
  }
}

/** god mode -> invulnerability -> shield -> health */
export function createDamageChain(): DamageHandler {
  const first = new GodModeHandler();
  first.setNext(new InvulnerabilityHandler()).setNext(new ShieldHandler()).setNext(new HealthHandler());
  return first;
}
