import { GameEventBus, HudObserver, NetworkObserver } from './events';
import { DungeonEntityFactory } from './factory';
import { GameOverState, MenuState, PausedState, PlayingState } from './states';
import { GameWorld } from './world';
/** Application Singleton. It is the only composition root for client services. */
export class GameApplication {
    static instance = new GameApplication();
    events = new GameEventBus();
    world = new GameWorld(new DungeonEntityFactory(), this.events);
    state = new MenuState();
    constructor() { this.events.subscribe(new HudObserver()); this.events.subscribe(new NetworkObserver()); }
    static getInstance() { return GameApplication.instance; }
    startPrototype() { this.world.createPrototype(); this.transitionTo(new PlayingState()); }
    pause() { this.transitionTo(new PausedState()); }
    endGame() { this.transitionTo(new GameOverState()); }
    returnToMenu() { this.transitionTo(new MenuState()); }
    transitionTo(next) { this.state = next; next.enter(this); }
    showMenu() { }
    showPause() { }
    showGameOver() { }
    runFrame() { }
}
