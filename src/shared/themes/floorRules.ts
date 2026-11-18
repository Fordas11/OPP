import { isIceAt } from '../maze/maze.js';
import type { IceTile, Player } from '../core/types.js';

export type FloorResult = 'none' | 'ice-damage' | 'fire-damage' | 'healed';
export interface FloorTiles { iceTiles: IceTile[]; fireTiles: IceTile[]; healingTiles: IceTile[]; }
export interface FloorRules { apply(player: Player, tiles: FloorTiles, dt: number): FloorResult; }

/**
 * Template Method: apply() keeps the same order of checks for every floor.
 * Subclasses only say which tiles kill, heal or hurt (the hook methods).
 */
export abstract class TileFloorRules implements FloorRules {
  protected constructor(finalClass: Function) {
    // TypeScript has no `final`, so a subclass of a final class fails here.
    if (new.target !== finalClass) throw new Error(`${finalClass.name} is final`);
  }

  /** The template method. */
  public apply(player: Player, tiles: FloorTiles, dt: number): FloorResult {
    player.environmentTimer = Math.max(0, player.environmentTimer - dt);
    if (this.isDeadly(player, tiles)) {
      player.hp = 0;
      return 'fire-damage';
    }
    if (player.environmentTimer > 0) return 'none';
    if (this.heals(player, tiles) && player.hp < player.maxHp) {
      player.hp++;
      player.environmentTimer = 1;
      return 'healed';
    }
    if (this.hurts(player, tiles)) {
      player.hp = Math.max(0, player.hp - 1);
      player.environmentTimer = 1;
      return 'ice-damage';
    }
    return 'none';
  }

  // Hooks: by default a tile does nothing.
  protected isDeadly(_player: Player, _tiles: FloorTiles): boolean { return false; }
  protected heals(_player: Player, _tiles: FloorTiles): boolean { return false; }
  protected hurts(_player: Player, _tiles: FloorTiles): boolean { return false; }
}

/** Final. Crypt floor: tiles do nothing. */
export class CryptFloorRules extends TileFloorRules {
  public constructor() { super(CryptFloorRules); }
}

/** Final. Ice hurts, healing tiles only on some floors. */
export class FrostFloorRules extends TileFloorRules {
  public constructor(private readonly healingEnabled: boolean) { super(FrostFloorRules); }
  protected override heals(player: Player, tiles: FloorTiles): boolean { return this.healingEnabled && isIceAt(tiles.healingTiles, player.x, player.y); }
  protected override hurts(player: Player, tiles: FloorTiles): boolean { return isIceAt(tiles.iceTiles, player.x, player.y); }
}

/** Final. Fire kills, ice hurts, healing tiles only on some floors. */
export class FireFloorRules extends TileFloorRules {
  public constructor(private readonly healingEnabled: boolean) { super(FireFloorRules); }
  protected override isDeadly(player: Player, tiles: FloorTiles): boolean { return isIceAt(tiles.fireTiles, player.x, player.y); }
  protected override heals(player: Player, tiles: FloorTiles): boolean { return this.healingEnabled && isIceAt(tiles.healingTiles, player.x, player.y); }
  protected override hurts(player: Player, tiles: FloorTiles): boolean { return isIceAt(tiles.iceTiles, player.x, player.y); }
}

/** Final. Garden floor: only healing tiles. */
export class GardenFloorRules extends TileFloorRules {
  public constructor() { super(GardenFloorRules); }
  protected override heals(player: Player, tiles: FloorTiles): boolean { return isIceAt(tiles.healingTiles, player.x, player.y); }
}
