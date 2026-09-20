import { Boulder, Knight, Pillar, Skeleton } from './entities';
export class DungeonEntityFactory {
    create(kind, id, position) {
        switch (kind) {
            case 'knight': return new Knight(id, position);
            case 'skeleton': return new Skeleton(id, position);
            case 'boulder': return new Boulder(id, position);
            case 'pillar': return new Pillar(id, position);
        }
    }
}
