import type { Difficulty, Vector2 } from '../shared/protocol';
import { GameEventBus } from './events';
import { DungeonEntityFactory, type EntityFactory } from './factory';
import { Knight, Obstacle, Skeleton, type Entity } from './entities';

export class DifficultySettings {
  public constructor(public readonly sightDistance: number, public readonly skeletonDamage: number) {}
  public static from(value: Difficulty): DifficultySettings {
    return value === 'calm' ? new DifficultySettings(180, 1)
      : value === 'brutal' ? new DifficultySettings(340, 2)
      : new DifficultySettings(250, 1);
  }
}

export class GameWorld {
  public level = 1;
  public knight!: Knight;
  public readonly skeletons: Skeleton[] = [];
  public readonly obstacles: Obstacle[] = [];

  public constructor(private readonly factory: EntityFactory = new DungeonEntityFactory(), private readonly events = new GameEventBus()) {}

  public createPrototype(): void {
    this.knight = this.factory.create('knight', 'local-knight', { x: 480, y: 320 }) as Knight;
    this.skeletons.length = 0; this.obstacles.length = 0;
    this.skeletons.push(this.factory.create('skeleton', 'skeleton-1', { x: 260, y: 230 }) as Skeleton);
    this.obstacles.push(this.factory.create('boulder', 'boulder-1', { x: 600, y: 340 }) as Obstacle);
    this.events.publish({ type: 'level-started', level: this.level });
  }

  public allEntities(): Entity[] { return [this.knight, ...this.skeletons, ...this.obstacles]; }
  public moveKnight(destination: Vector2): void { this.knight.position = destination; }
}
