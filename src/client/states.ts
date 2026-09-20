export interface GameStateHost { showMenu(): void; showPause(): void; showGameOver(): void; runFrame(): void; }
export interface GameState { readonly name: string; enter(host: GameStateHost): void; }

/** State pattern: menu flow no longer depends on scattered string comparisons. */
export class MenuState implements GameState { public readonly name = 'menu'; public enter(host: GameStateHost): void { host.showMenu(); } }
export class PlayingState implements GameState { public readonly name = 'playing'; public enter(host: GameStateHost): void { host.runFrame(); } }
export class PausedState implements GameState { public readonly name = 'paused'; public enter(host: GameStateHost): void { host.showPause(); } }
export class GameOverState implements GameState { public readonly name = 'game-over'; public enter(host: GameStateHost): void { host.showGameOver(); } }
