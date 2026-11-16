import { MAX_SHIELD } from '../core/constants.js';
import type { Player, PickupData } from '../core/types.js';

/**
 * Visitor: the items on the floor (elements) are always the same three,
 * but we need several different operations on them. Each operation is a visitor,
 * so the item classes do not grow every time we add one.
 */
export interface PickupVisitor<R> {
  visitHeart(pickup: HeartPickup): R;
  visitAmmo(pickup: AmmoPickup): R;
  visitShield(pickup: ShieldPickup): R;
}

/** Element base class. Own fields are sent to the browser as JSON, methods are not. */
export abstract class Pickup implements PickupData {
  public constructor(public readonly kind: PickupData['kind'], public readonly x: number, public readonly y: number, public readonly amount: number) {}
  public abstract accept<R>(visitor: PickupVisitor<R>): R;
}

export class HeartPickup extends Pickup {
  public constructor(x: number, y: number) { super('heart', x, y, 2); }
  public accept<R>(visitor: PickupVisitor<R>): R { return visitor.visitHeart(this); }
}

export class AmmoPickup extends Pickup {
  public constructor(x: number, y: number) { super('ammo', x, y, 8); }
  public accept<R>(visitor: PickupVisitor<R>): R { return visitor.visitAmmo(this); }
}

export class ShieldPickup extends Pickup {
  public constructor(x: number, y: number) { super('shield', x, y, 1); }
  public accept<R>(visitor: PickupVisitor<R>): R { return visitor.visitShield(this); }
}

/** Visitor 1: would this player gain anything? If not, the item stays for a teammate. */
export class NeedsPickupVisitor implements PickupVisitor<boolean> {
  public constructor(private readonly player: Player) {}
  public visitHeart(): boolean { return this.player.hp < this.player.maxHp; }
  public visitAmmo(): boolean { return this.player.ammo < this.player.maxAmmo; }
  public visitShield(): boolean { return this.player.shield < MAX_SHIELD; }
}

/** Visitor 2: gives the item's bonus to the player. */
export class CollectPickupVisitor implements PickupVisitor<void> {
  public constructor(private readonly player: Player) {}
  public visitHeart(pickup: HeartPickup): void { this.player.hp = Math.min(this.player.maxHp, this.player.hp + pickup.amount); }
  public visitAmmo(pickup: AmmoPickup): void { this.player.ammo = Math.min(this.player.maxAmmo, this.player.ammo + pickup.amount); }
  public visitShield(pickup: ShieldPickup): void { this.player.shield = Math.min(MAX_SHIELD, this.player.shield + pickup.amount); }
}

/** Visitor 3: text above the knight and particle color after pickup. */
export class DescribePickupVisitor implements PickupVisitor<{ text: string; color: string }> {
  public visitHeart(pickup: HeartPickup): { text: string; color: string } { return { text: `+${pickup.amount} HP`, color: '#ff6f91' }; }
  public visitAmmo(pickup: AmmoPickup): { text: string; color: string } { return { text: `+${pickup.amount} ARROWS`, color: '#f3d58b' }; }
  public visitShield(): { text: string; color: string } { return { text: 'SHIELD', color: '#7fb8ff' }; }
}
