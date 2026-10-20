import { CHEAT_CODES } from '../../shared/cheats/cheats.js';
import type { GameSession } from '../session/session.js';
import { settings } from '../settings/settings.js';
import { closeSettings, handleBindingKey, handleBindingMouse, isSettingsOpen, openSettings } from '../settings/settingsPanel.js';

/** Facade client: menu buttons. */
export class MenuController {
  public constructor(private readonly session: GameSession) {
    const codeInput = document.querySelector<HTMLInputElement>('#codeInput')!;
    this.on('#createButton', () => void session.createRoom());
    this.on('#joinButton', () => void session.joinRoom(codeInput.value));
    this.on('#menuSettingsButton', openSettings);
    this.on('#startGameButton', () => session.startGame());
    this.on('#cancelButton', () => session.leave());
    this.on('#resumeButton', () => session.togglePause());
    this.on('#pauseSettingsButton', openSettings);
    this.on('#leaveButton', () => session.leave());
    this.on('#gameOverLeaveButton', () => session.leave());
    this.on('#restartButton', () => session.restart());
  }

  private on(selector: string, action: () => void): void {
    document.querySelector(selector)!.addEventListener('click', action);
  }
}

/** Facade client: in-game keyboard and mouse. */
export class KeyboardController {
  private typed = ''; // last 3 letters, for cheat codes

  public constructor(private readonly session: GameSession, canvas: HTMLCanvasElement) {
    window.addEventListener('keydown', event => this.onKeyDown(event));
    window.addEventListener('keyup', event => session.releaseKey(event.code));
    window.addEventListener('blur', () => session.releaseAllKeys());

    // Capture phase: the settings panel gets the click first.
    window.addEventListener('mousedown', handleBindingMouse, true);

    canvas.addEventListener('mousemove', event => session.moveMouse(event, canvas));
    canvas.addEventListener('mousedown', event => {
      if (!session.isPlaying()) return;
      const button = `Mouse${event.button}`;
      if (button === settings.bindings.attack) session.attack();
      else if (button === settings.bindings.shoot) session.shoot();
      else return;
      event.preventDefault();
    });
    canvas.addEventListener('contextmenu', event => event.preventDefault());
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (handleBindingKey(event)) return;

    if (event.code === 'Escape') {
      event.preventDefault();
      if (isSettingsOpen()) closeSettings();
      else this.session.togglePause();
      return;
    }
    if (!this.session.isPlaying()) return;

    // Ctrl+Z: undo our last cheat.
    if (event.ctrlKey && event.code === 'KeyZ') {
      event.preventDefault();
      this.session.undoCheat();
      return;
    }

    event.preventDefault();
    this.session.pressKey(event.code);
    if (!event.repeat) this.typeLetter(event.code);
  }

  /** Sends a cheat when the last 3 letters match a code ("kkk"). */
  private typeLetter(code: string): void {
    if (!code.startsWith('Key')) return;
    this.typed = (this.typed + code.slice(3).toLowerCase()).slice(-3);
    if (CHEAT_CODES[this.typed]) {
      this.session.sendCheat(this.typed);
      this.typed = '';
    }
  }
}
