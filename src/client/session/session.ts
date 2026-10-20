import { MAX_PLAYERS } from '../../shared/core/constants.js';
import type { ServerMessage } from '../../shared/core/messages.js';
import type { GameState } from '../../shared/core/types.js';
import { addBurst, addFlash, clearEffects } from '../render/effects.js';
import { InputState } from '../input/input.js';
import { ServerConnection } from './network.js';
import { ScreenManager } from './screens.js';
import { Smoothing } from './smoothing.js';
import { settings } from '../settings/settings.js';

/** Facade: controllers only talk to this; it drives connection, screens, input and smoothing. */
export class GameSession {
  private readonly connection = new ServerConnection();
  private readonly screens = new ScreenManager();
  private readonly input = new InputState();
  private readonly smoothing = new Smoothing();
  private myId = 0;
  private state: GameState | null = null;

  public get playerId(): number { return this.myId; }

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

  /** Disconnects and returns to the menu. */
  public leave(message = ''): void {
    this.connection.disconnect();
    this.state = null;
    this.input.releaseAllKeys();
    this.smoothing.reset();
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
  public sendCheat(code: string): void { this.connection.send({ type: 'cheat', code }); }
  public undoCheat(): void { this.connection.send({ type: 'undo-cheat' }); }

  /** One movement step: predict it locally and send it. */
  public sendInput(): void {
    const state = this.state;
    const me = state?.players.find(p => p.id === this.myId);
    if (!state || !me || state.phase !== 'playing') return;
    const input = this.input.readInput(this.smoothing.myPosition() ?? me);
    input.seq = this.smoothing.step(input, me, state);
    this.connection.send({ type: 'input', input });
  }

  /** State to draw this frame. `stepProgress` is 0..1 into the current step. */
  public frameState(now: number, stepProgress: number, dt: number): GameState | null {
    if (!this.state) return null;
    return this.smoothing.view(this.state, this.myId, now, stepProgress, dt, position => this.input.aimFrom(position));
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
        this.smoothing.reset();
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
    this.smoothing.onState(next, this.myId, performance.now());
    if (next.phase === 'over' && this.screens.currentScreen() !== 'over') {
      this.screens.setText('#finalLevel', `You reached floor ${next.level}.`);
      this.input.releaseAllKeys();
      this.screens.showScreen('over');
    }
  }
}
