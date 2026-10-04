import type { EnemyKind } from './enemyFactory.js';
import { isIceAt, type MazeVariant } from './maze.js';
import type { IceTile, Player } from './types.js';

// Abstract Factory products. Each theme family supplies all three products.
export interface EnemyAppearance { readonly color: string; }
export interface MazeAppearance { readonly wallColor: string; }
export interface EffectAppearance { readonly hitColor: string; }
export type FloorResult = 'none' | 'ice-damage' | 'fire-damage' | 'healed';
export interface FloorRules { apply(player: Player, tiles: { iceTiles: IceTile[]; fireTiles: IceTile[]; healingTiles: IceTile[] }, dt: number): FloorResult; }
export interface ThemeFactory {
  readonly id: 'crypt' | 'frost' | 'fire' | 'garden';
  readonly mazeVariant: MazeVariant;
  createEnemyAppearance(kind: EnemyKind): EnemyAppearance;
  createMazeAppearance(): MazeAppearance;
  createEffectAppearance(): EffectAppearance;
  createFloorRules(): FloorRules;
}

class CryptEnemyAppearance implements EnemyAppearance { public readonly color = '#c9c1aa'; }
class CryptMazeAppearance implements MazeAppearance { public readonly wallColor = '#312b38'; }
class CryptEffectAppearance implements EffectAppearance { public readonly hitColor = '#ded6bf'; }
class CryptFloorRules implements FloorRules { public apply(_player: Player, _tiles: { iceTiles: IceTile[]; fireTiles: IceTile[]; healingTiles: IceTile[] }, _dt: number): FloorResult { return 'none'; } }
export class CryptThemeFactory implements ThemeFactory {
  public readonly id = 'crypt' as const;
  public readonly mazeVariant = 'classic' as const;
  public createEnemyAppearance(_kind: EnemyKind): EnemyAppearance { return new CryptEnemyAppearance(); }
  public createMazeAppearance(): MazeAppearance { return new CryptMazeAppearance(); }
  public createEffectAppearance(): EffectAppearance { return new CryptEffectAppearance(); }
  public createFloorRules(): FloorRules { return new CryptFloorRules(); }
}

class FrostEnemyAppearance implements EnemyAppearance { public readonly color = '#b9dcdf'; }
class FrostMazeAppearance implements MazeAppearance { public readonly wallColor = '#29465b'; }
class FrostEffectAppearance implements EffectAppearance { public readonly hitColor = '#b9f3ff'; }
class FrostFloorRules implements FloorRules {
  public constructor(private readonly healingEnabled: boolean) {}
  public apply(player: Player, tiles: { iceTiles: IceTile[]; fireTiles: IceTile[]; healingTiles: IceTile[] }, dt: number): FloorResult {
    player.environmentTimer = Math.max(0, player.environmentTimer - dt);
    if (this.healingEnabled && isIceAt(tiles.healingTiles, player.x, player.y) && player.environmentTimer <= 0 && player.hp < player.maxHp) {
      player.hp++; player.environmentTimer = 1; return 'healed';
    }
    if (!isIceAt(tiles.iceTiles, player.x, player.y) || player.environmentTimer > 0) return 'none';
    player.hp = Math.max(0, player.hp - 1);
    player.environmentTimer = 1;
    return 'ice-damage';
  }
}
export class FrostThemeFactory implements ThemeFactory {
  public readonly id = 'frost' as const;
  public constructor(public readonly mazeVariant: MazeVariant = 'ice') {}
  public createEnemyAppearance(_kind: EnemyKind): EnemyAppearance { return new FrostEnemyAppearance(); }
  public createMazeAppearance(): MazeAppearance { return new FrostMazeAppearance(); }
  public createEffectAppearance(): EffectAppearance { return new FrostEffectAppearance(); }
  public createFloorRules(): FloorRules { return new FrostFloorRules(this.mazeVariant === 'ice-healing'); }
}

class FireEnemyAppearance implements EnemyAppearance { public readonly color = '#f0b06b'; }
class FireMazeAppearance implements MazeAppearance { public readonly wallColor = '#542b20'; }
class FireEffectAppearance implements EffectAppearance { public readonly hitColor = '#ff9a41'; }
class FireFloorRules implements FloorRules {
  public constructor(private readonly healingEnabled: boolean) {}
  public apply(player: Player, tiles: { iceTiles: IceTile[]; fireTiles: IceTile[]; healingTiles: IceTile[] }, dt: number): FloorResult {
    player.environmentTimer = Math.max(0, player.environmentTimer - dt);
    if (isIceAt(tiles.fireTiles, player.x, player.y)) { player.hp = 0; return 'fire-damage'; }
    if (this.healingEnabled && isIceAt(tiles.healingTiles, player.x, player.y) && player.environmentTimer <= 0 && player.hp < player.maxHp) { player.hp++; player.environmentTimer = 1; return 'healed'; }
    if (isIceAt(tiles.iceTiles, player.x, player.y) && player.environmentTimer <= 0) { player.hp = Math.max(0, player.hp - 1); player.environmentTimer = 1; return 'ice-damage'; }
    return 'none';
  }
}
export class FireThemeFactory implements ThemeFactory {
  public readonly id = 'fire' as const;
  public constructor(public readonly mazeVariant: MazeVariant = 'fire-ice') {}
  public createEnemyAppearance(_kind: EnemyKind): EnemyAppearance { return new FireEnemyAppearance(); }
  public createMazeAppearance(): MazeAppearance { return new FireMazeAppearance(); }
  public createEffectAppearance(): EffectAppearance { return new FireEffectAppearance(); }
  public createFloorRules(): FloorRules { return new FireFloorRules(this.mazeVariant === 'fire-ice-healing'); }
}

class GardenEnemyAppearance implements EnemyAppearance { public readonly color = '#d7d4a1'; }
class GardenMazeAppearance implements MazeAppearance { public readonly wallColor = '#35513a'; }
class GardenEffectAppearance implements EffectAppearance { public readonly hitColor = '#a9ed8a'; }
class GardenFloorRules implements FloorRules {
  public apply(player: Player, tiles: { iceTiles: IceTile[]; fireTiles: IceTile[]; healingTiles: IceTile[] }, dt: number): FloorResult {
    player.environmentTimer = Math.max(0, player.environmentTimer - dt);
    if (!isIceAt(tiles.healingTiles, player.x, player.y) || player.environmentTimer > 0 || player.hp >= player.maxHp) return 'none';
    player.hp++;
    player.environmentTimer = 1;
    return 'healed';
  }
}
export class GardenThemeFactory implements ThemeFactory {
  public readonly id = 'garden' as const;
  public readonly mazeVariant = 'garden' as const;
  public createEnemyAppearance(_kind: EnemyKind): EnemyAppearance { return new GardenEnemyAppearance(); }
  public createMazeAppearance(): MazeAppearance { return new GardenMazeAppearance(); }
  public createEffectAppearance(): EffectAppearance { return new GardenEffectAppearance(); }
  public createFloorRules(): FloorRules { return new GardenFloorRules(); }
}

export function themeForLevel(level: number): ThemeFactory {
  const campaign: ThemeFactory[] = [
    new CryptThemeFactory(),
    new FrostThemeFactory('ice-healing'),
    new FrostThemeFactory('ice'),
    new FireThemeFactory('fire-ice-healing'),
    new FireThemeFactory('fire-ice'),
  ];
  return campaign[Math.min(level, campaign.length) - 1];
}

/** Converts the three Abstract Factory products into data safe to send to the browser. */
export function visualsFrom(factory: ThemeFactory): { wallColor: string; enemyColor: string; effectColor: string } {
  return {
    wallColor: factory.createMazeAppearance().wallColor,
    enemyColor: factory.createEnemyAppearance('skeleton').color,
    effectColor: factory.createEffectAppearance().hitColor,
  };
}
