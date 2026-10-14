import type { Effect, GameState } from './types.js';

export type GameEvent = { type: 'enemy-hit'; x: number; y: number } | { type: 'enemy-defeated'; x: number; y: number } | { type: 'player-hit' | 'ice-damage' | 'fire-damage'; x: number; y: number } | { type: 'heart-collected' | 'healed' | 'arrow-bounce'; x: number; y: number };
export interface GameEventObserver { update(event: GameEvent): void; }

/** Subject in Observer: Game publishes events without knowing its observers. */
export class GameEventPublisher {
  private readonly observers = new Set<GameEventObserver>();
  public subscribe(observer: GameEventObserver): void { this.observers.add(observer); }
  public notify(event: GameEvent): void { this.observers.forEach(observer => observer.update(event)); }
}

/** Concrete observer: converts game events to effects sent to every browser in GameState. */
export class EffectObserver implements GameEventObserver {
  public constructor(private readonly state: GameState, private readonly hitColor: () => string) {}
  public update(event: GameEvent): void {
    const effect: Effect = event.type === 'heart-collected' || event.type === 'healed'
      ? { x: event.x, y: event.y, color: '#ff6f91', amount: 16 }
      : event.type === 'arrow-bounce'
        ? { x: event.x, y: event.y, color: '#f3d58b', amount: 4 }
      : event.type === 'ice-damage'
        ? { x: event.x, y: event.y, color: '#b9f3ff', amount: 10 }
      : event.type === 'fire-damage'
        ? { x: event.x, y: event.y, color: '#ff7b32', amount: 28 }
      : event.type === 'player-hit'
      ? { x: event.x, y: event.y, color: '#b74843', amount: 10 }
      : { x: event.x, y: event.y, color: this.hitColor(), amount: event.type === 'enemy-defeated' ? 18 : 7 };
    this.state.effects.push(effect);
  }
}
