import { GameEventBus, HudObserver, NetworkObserver } from './events';
import { DungeonEntityFactory } from './factory';
import { GameOverState, MenuState, PausedState, PlayingState, type GameState, type GameStateHost } from './states';
import { GameWorld } from './world';

/** Application Singleton. It is the only composition root for client services. */
export class GameApplication implements GameStateHost {
  private static readonly instance = new GameApplication();
  private readonly events = new GameEventBus();
  private readonly world = new GameWorld(new DungeonEntityFactory(), this.events);
  private state: GameState = new MenuState();

  private constructor() { this.events.subscribe(new HudObserver()); this.events.subscribe(new NetworkObserver()); }
  public static getInstance(): GameApplication { return GameApplication.instance; }

  public startPrototype(): void { this.world.createPrototype(); this.transitionTo(new PlayingState()); }
  public pause(): void { this.transitionTo(new PausedState()); }
  public endGame(): void { this.transitionTo(new GameOverState()); }
  public returnToMenu(): void { this.transitionTo(new MenuState()); }
  public transitionTo(next: GameState): void { this.state = next; next.enter(this); }

  public showMenu(): void { /* Bind #startScreen here when migrating the current prototype. */ }
  public showPause(): void { /* Bind #pauseScreen here when migrating the current prototype. */ }
  public showGameOver(): void { /* Bind #gameOver here when migrating the current prototype. */ }
  public runFrame(): void { /* Delegate update/draw to the existing Canvas renderer. */ }
}
