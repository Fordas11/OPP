import type { Vector2 } from '../shared/protocol';
import { Boulder, Knight, Pillar, Skeleton, type Entity } from './entities';

export type EntityKind = 'knight' | 'skeleton' | 'boulder' | 'pillar';

/** Factory pattern: one creation boundary for every map object family. */
export interface EntityFactory { create(kind: EntityKind, id: string, position: Vector2): Entity; }

export class DungeonEntityFactory implements EntityFactory {
  public create(kind: EntityKind, id: string, position: Vector2): Entity {
    switch (kind) {
      case 'knight': return new Knight(id, position);
      case 'skeleton': return new Skeleton(id, position);
      case 'boulder': return new Boulder(id, position);
      case 'pillar': return new Pillar(id, position);
    }
  }
}
