import type { Difficulty } from '../shared/protocol';

export type GameEvent =
  | { type: 'level-started'; level: number }
  | { type: 'knight-hurt'; amount: number }
  | { type: 'difficulty-changed'; difficulty: Difficulty };

export interface GameObserver { onGameEvent(event: GameEvent): void; }

/** Observer pattern: UI and networking receive the same domain events without coupling. */
export class GameEventBus {
  private readonly observers = new Set<GameObserver>();
  public subscribe(observer: GameObserver): void { this.observers.add(observer); }
  public unsubscribe(observer: GameObserver): void { this.observers.delete(observer); }
  public publish(event: GameEvent): void { this.observers.forEach(observer => observer.onGameEvent(event)); }
}

export class HudObserver implements GameObserver { public lastEvent?: GameEvent; public onGameEvent(event: GameEvent): void { this.lastEvent = event; } }
export class NetworkObserver implements GameObserver { public readonly outgoing: GameEvent[] = []; public onGameEvent(event: GameEvent): void { this.outgoing.push(event); } }
