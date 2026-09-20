import type { Vector2 } from '../shared/protocol';

export abstract class Entity {
  public constructor(public readonly id: string, public position: Vector2, public readonly radius: number) {}
  public abstract readonly type: string;
}

export class Knight extends Entity {
  public readonly type = 'knight';
  public health = 6;
  public aim = 0;
  public constructor(id: string, position: Vector2) { super(id, position, 18); }
}

export class Skeleton extends Entity {
  public readonly type = 'skeleton';
  public health = 2;
  public cooldown = 0;
  public constructor(id: string, position: Vector2) { super(id, position, 16); }
}

export abstract class Obstacle extends Entity { public abstract readonly type: 'boulder' | 'pillar'; }
export class Boulder extends Obstacle { public readonly type = 'boulder'; public constructor(id: string, position: Vector2, radius = 28) { super(id, position, radius); } }
export class Pillar extends Obstacle { public readonly type = 'pillar'; public constructor(id: string, position: Vector2, radius = 28) { super(id, position, radius); } }
