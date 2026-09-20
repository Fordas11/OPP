export class AsyncLock {
    queue = Promise.resolve();
    async runExclusive(action) {
        let release;
        const previous = this.queue;
        this.queue = new Promise(resolve => { release = resolve; });
        await previous;
        try {
            return await action();
        }
        finally {
            release();
        }
    }
}
export class GameRoom {
    id;
    players = new Map();
    level = 1;
    constructor(id) {
        this.id = id;
    }
    snapshot() { return { roomId: this.id, level: this.level, players: [...this.players.values()] }; }
}
/** Singleton. Eager module initialization plus AsyncLock makes registry access deterministic. */
export class RoomRegistry {
    static instance = new RoomRegistry();
    rooms = new Map();
    lock = new AsyncLock();
    constructor() { }
    static getInstance() { return RoomRegistry.instance; }
    withRoom(roomId, action) {
        return this.lock.runExclusive(async () => action(this.rooms.get(roomId) ?? this.createRoom(roomId)));
    }
    createRoom(id) { const room = new GameRoom(id); this.rooms.set(id, room); return room; }
}
