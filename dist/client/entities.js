export class Entity {
    id;
    position;
    radius;
    constructor(id, position, radius) {
        this.id = id;
        this.position = position;
        this.radius = radius;
    }
}
export class Knight extends Entity {
    type = 'knight';
    health = 6;
    aim = 0;
    constructor(id, position) { super(id, position, 18); }
}
export class Skeleton extends Entity {
    type = 'skeleton';
    health = 2;
    cooldown = 0;
    constructor(id, position) { super(id, position, 16); }
}
export class Obstacle extends Entity {
}
export class Boulder extends Obstacle {
    type = 'boulder';
    constructor(id, position, radius = 28) { super(id, position, radius); }
}
export class Pillar extends Obstacle {
    type = 'pillar';
    constructor(id, position, radius = 28) { super(id, position, radius); }
}
