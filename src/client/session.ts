import { MAX_PLAYERS } from '../shared/constants.js';
import type { ServerMessage } from '../shared/messages.js';
import type { GameState } from '../shared/types.js';
import { addBurst, addFlash, clearEffects } from './effects.js';
import { InputState } from './input.js';
import { ServerConnection } from './network.js';
import { ScreenManager } from './screens.js';
import { settings } from './settings.js';

/**
 * Facade pattern. The menu and the keyboard controllers only talk to this class.
 * Behind it, three subsystems work together: ServerConnection (WebSocket),
 * ScreenManager (overlays and texts) and InputState (keys and mouse), plus the particle effects.
 */
export class GameSession {
  private readonly connection = new ServerConnection();
  private readonly screens = new ScreenManager();
  private readonly input = new InputState();
  private myId = 0;
  private state: GameState | null = null;

  public get playerId(): number { return this.myId; }
  public get gameState(): GameState | null { return this.state; }

  // ---------- Used by MenuController ----------

  public async createRoom(): Promise<void> {
    this.screens.setText('#menuMessage', '');
    if (await this.connect()) this.connection.send({ type: 'create-room', difficulty: settings.difficulty });
  }

  public async joinRoom(rawCode: string): Promise<void> {
    const code = rawCode.trim().toUpperCase();
    if (code.length !== 4) return this.screens.setText('#menuMessage', 'Enter the 4-letter room code.');
    this.screens.setText('#menuMessage', '');
    if (await this.connect()) this.connection.send({ type: 'join-room', code });
  }

  public startGame(): void { this.connection.send({ type: 'start-game' }); }
  public restart(): void { this.connection.send({ type: 'restart' }); }

  /** Closes the connection, clears everything and goes back to the main menu. */
  public leave(message = ''): void {
    this.connection.disconnect();
    this.state = null;
    this.input.releaseAllKeys();
    clearEffects();
    this.screens.setText('#menuMessage', message);
    this.screens.showScreen('menu');
  }

  public togglePause(): void {
    if (this.screens.currentScreen() === 'playing') {
      this.input.releaseAllKeys();
      this.screens.showScreen('pause');
    } else if (this.screens.currentScreen() === 'pause') {
      this.screens.showScreen('playing');
    }
  }

  // ---------- Used by KeyboardController ----------

  public isPlaying(): boolean { return this.screens.currentScreen() === 'playing'; }
  public pressKey(code: string): void { this.input.pressKey(code); }
  public releaseKey(code: string): void { this.input.releaseKey(code); }
  public releaseAllKeys(): void { this.input.releaseAllKeys(); }
  public moveMouse(event: MouseEvent, canvas: HTMLCanvasElement): void { this.input.moveMouse(event, canvas); }
  public attack(): void { this.input.requestAttack(); }
  public shoot(): void { this.input.requestShoot(); }

  /** Sends our keys and mouse to the server. Called as often as the server runs its ticks. */
  public sendInput(): void {
    const me = this.state?.players.find(p => p.id === this.myId);
    if (me && this.state?.phase === 'playing') this.connection.send({ type: 'input', input: this.input.readInput(me) });
  }

  // ---------- Messages from the server ----------

  private async connect(): Promise<boolean> {
    if (this.connection.isConnected()) return true;
    try {
      await this.connection.connect(message => this.onServerMessage(message), () => this.leave('Connection to the server was lost.'));
      return true;
    } catch {
      this.screens.setText('#menuMessage', 'Cannot reach the server.');
      return false;
    }
  }

  private onServerMessage(message: ServerMessage): void {
    switch (message.type) {
      case 'lobby':
        this.showLobby(message);
        break;
      case 'game-started':
        this.myId = message.you;
        this.state = null;
        clearEffects();
        this.screens.showScreen('playing');
        break;
      case 'state':
        this.onState(message.state);
        break;
      case 'error':
        this.screens.setText('#menuMessage', message.message);
        break;
    }
  }

  private showLobby(lobby: Extract<ServerMessage, { type: 'lobby' }>): void {
    this.screens.setText('#roomCode', lobby.code);
    this.screens.setText('#lobbyPlayers', `Players: ${lobby.players} / ${MAX_PLAYERS}`);
    this.screens.setText('#lobbyHint', lobby.isHost ? 'Press Start Game when everyone has joined.' : 'Waiting for the host to start the game...');
    document.querySelector('#startGameButton')!.classList.toggle('hidden', !lobby.isHost);
    this.screens.showScreen('waiting');
  }

  private onState(next: GameState): void {
    const before = this.state?.players.find(p => p.id === this.myId);
    const after = next.players.find(p => p.id === this.myId);
    if (before && after && after.hp < before.hp) addFlash();
    for (const effect of next.effects) addBurst(effect.x, effect.y, effect.color, effect.amount);

    this.state = next;
    if (next.phase === 'over' && this.screens.currentScreen() !== 'over') {
      this.screens.setText('#finalLevel', `You reached floor ${next.level}.`);
      this.input.releaseAllKeys();
      this.screens.showScreen('over');
    }
  }
}
