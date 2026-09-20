import type { GameSnapshot, PlayerSnapshot } from '../shared/protocol';

export class AsyncLock {
  private queue: Promise<void> = Promise.resolve();

  public async runExclusive<T>(action: () => T | Promise<T>): Promise<T> {
    let release!: () => void;
    const previous = this.queue;
    this.queue = new Promise<void>(resolve => { release = resolve; });
    await previous;
    try { return await action(); } finally { release(); }
  }
}

export class GameRoom {
  public readonly players = new Map<string, PlayerSnapshot>();
  public level = 1;

  public constructor(public readonly id: string) {}

  public snapshot(): GameSnapshot { return { roomId: this.id, level: this.level, players: [...this.players.values()] }; }
}

/** Singleton. Eager module initialization plus AsyncLock makes registry access deterministic. */
export class RoomRegistry {
  private static readonly instance = new RoomRegistry();
  private readonly rooms = new Map<string, GameRoom>();
  private readonly lock = new AsyncLock();

  private constructor() {}
  public static getInstance(): RoomRegistry { return RoomRegistry.instance; }

  public withRoom<T>(roomId: string, action: (room: GameRoom) => T | Promise<T>): Promise<T> {
    return this.lock.runExclusive(async () => action(this.rooms.get(roomId) ?? this.createRoom(roomId)));
  }

  private createRoom(id: string): GameRoom { const room = new GameRoom(id); this.rooms.set(id, room); return room; }
}
