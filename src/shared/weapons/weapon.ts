export const BASE_REACH = 83;

/** Base sword and upgrades share this. */
export interface Weapon {
  name(): string;
  damage(): number;
  reach(): number;
}

/** Starting sword. */
export class Sword implements Weapon {
  public name(): string { return 'Sword'; }
  public damage(): number { return 1; }
  public reach(): number { return BASE_REACH; }
}

/** Decorator: wraps a weapon and changes one stat. */
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

/** In the order they are earned. */
export const UPGRADES: Array<new (inner: Weapon) => Weapon> = [LongBlade, SharpBlade, BlessedBlade];
