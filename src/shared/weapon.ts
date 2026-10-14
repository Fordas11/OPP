export const BASE_REACH = 83;

/** What the game needs from a weapon. Both the base sword and every upgrade look like this. */
export interface Weapon {
  name(): string;
  damage(): number;
  reach(): number;
}

/** The plain sword every knight starts with. Upgrades wrap it (see the decorators below). */
export class Sword implements Weapon {
  public name(): string { return 'Sword'; }
  public damage(): number { return 1; }
  public reach(): number { return BASE_REACH; }
}

/** Decorator pattern: wraps a weapon and changes one number, without touching the weapon inside. */
abstract class WeaponDecorator implements Weapon {
  public constructor(protected readonly inner: Weapon) {}
  public name(): string { return this.inner.name(); }
  public damage(): number { return this.inner.damage(); }
  public reach(): number { return this.inner.reach(); }
}

export class LongBlade extends WeaponDecorator {
  public override name(): string { return `Long ${this.inner.name()}`; }
  public override reach(): number { return this.inner.reach() + 15; }
}

export class SharpBlade extends WeaponDecorator {
  public override name(): string { return `Sharp ${this.inner.name()}`; }
  public override damage(): number { return this.inner.damage() + 1; }
}

export class BlessedBlade extends WeaponDecorator {
  public override name(): string { return `Blessed ${this.inner.name()}`; }
  public override reach(): number { return this.inner.reach() + 10; }
}

/** Upgrades in the order a knight earns them (see KILLS_PER_UPGRADE in game.ts). */
export const UPGRADES: Array<new (inner: Weapon) => Weapon> = [LongBlade, SharpBlade, BlessedBlade];
