import { GameEventBus } from './events';
import { DungeonEntityFactory } from './factory';
export class DifficultySettings {
    sightDistance;
    skeletonDamage;
    constructor(sightDistance, skeletonDamage) {
        this.sightDistance = sightDistance;
        this.skeletonDamage = skeletonDamage;
    }
    static from(value) {
        return value === 'calm' ? new DifficultySettings(180, 1)
            : value === 'brutal' ? new DifficultySettings(340, 2)
                : new DifficultySettings(250, 1);
    }
}
export class GameWorld {
    factory;
    events;
    level = 1;
    knight;
    skeletons = [];
    obstacles = [];
    constructor(factory = new DungeonEntityFactory(), events = new GameEventBus()) {
        this.factory = factory;
        this.events = events;
    }
    createPrototype() {
        this.knight = this.factory.create('knight', 'local-knight', { x: 480, y: 320 });
        this.skeletons.length = 0;
        this.obstacles.length = 0;
        this.skeletons.push(this.factory.create('skeleton', 'skeleton-1', { x: 260, y: 230 }));
        this.obstacles.push(this.factory.create('boulder', 'boulder-1', { x: 600, y: 340 }));
        this.events.publish({ type: 'level-started', level: this.level });
    }
    allEntities() { return [this.knight, ...this.skeletons, ...this.obstacles]; }
    moveKnight(destination) { this.knight.position = destination; }
}
