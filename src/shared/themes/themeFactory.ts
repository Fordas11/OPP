import type { EnemyKind } from '../enemies/enemyFactory.js';
import type { MazeVariant } from '../maze/maze.js';
import { CryptFloorRules, FireFloorRules, FrostFloorRules, GardenFloorRules, type FloorRules } from './floorRules.js';

export type { FloorResult, FloorRules } from './floorRules.js';

// Abstract Factory products. Each theme family supplies all three products.
export interface EnemyAppearance { readonly color: string; }
export interface MazeAppearance { readonly wallColor: string; }
export interface EffectAppearance { readonly hitColor: string; }
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

/** Theme colors for the browser. */
export function visualsFrom(factory: ThemeFactory): { wallColor: string; enemyColor: string } {
  return {
    wallColor: factory.createMazeAppearance().wallColor,
    enemyColor: factory.createEnemyAppearance('skeleton').color,
  };
}
