/** State pattern: menu flow no longer depends on scattered string comparisons. */
export class MenuState {
    name = 'menu';
    enter(host) { host.showMenu(); }
}
export class PlayingState {
    name = 'playing';
    enter(host) { host.runFrame(); }
}
export class PausedState {
    name = 'paused';
    enter(host) { host.showPause(); }
}
export class GameOverState {
    name = 'game-over';
    enter(host) { host.showGameOver(); }
}
