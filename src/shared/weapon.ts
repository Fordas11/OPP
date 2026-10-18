export const BASE_REACH = 83;

/** Numbers that describe a weapon. Kept in a separate object so copying it shows deep vs shallow. */
export interface WeaponStats { damage: number; reach: number }

/** What the game needs from a weapon. Both the base sword and every upgrade look like this. */
export interface Weapon {
  name(): string;
  damage(): number;
  reach(): number;
}

/** Prototype pattern: one ready sword is copied for every player with clone(). */
export class Sword implements Weapon {
  public constructor(public readonly stats: WeaponStats = { damage: 1, reach: BASE_REACH }) {}

  public name(): string { return 'Sword'; }
  public damage(): number { return this.stats.damage; }
  public reach(): number { return this.stats.reach; }

  /** Deep copy: the new sword gets its own stats object. This is the one the game uses. */
  public clone(): Sword { return new Sword(structuredClone(this.stats)); }

  /** Shallow copy: the new sword shares the SAME stats object. Only used to compare with clone(). */
  public shallowClone(): Sword { return new Sword(this.stats); }
}

export const SWORD_PROTOTYPE = new Sword();

/** JavaScript has no memory addresses, so each object gets a number the first time it is asked for. */
const ids = new WeakMap<object, number>();
let lastId = 0;
export function objectId(value: object): number {
  if (!ids.has(value)) ids.set(value, ++lastId);
  return ids.get(value)!;
}

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
