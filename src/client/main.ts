import { TICK_RATE } from '../shared/core/constants.js';
import { KeyboardController, MenuController } from './input/controllers.js';
import { updateEffects } from './render/effects.js';
import { drawGame } from './render/render.js';
import { GameSession } from './session/session.js';
import { loadSettings } from './settings/settings.js';

const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const ctx = canvas.getContext('2d')!;

// Facade: both controllers use the same GameSession and nothing behind it.
const session = new GameSession();
new MenuController(session);
new KeyboardController(session, canvas);

// ---------- Main loops ----------

// Send our input to the server as often as the server runs its ticks.
setInterval(() => session.sendInput(), 1000 / TICK_RATE);

let lastTime = performance.now();
function frame(time: number): void {
  const dt = Math.min(0.05, (time - lastTime) / 1000);
  lastTime = time;

  updateEffects(dt);
  const state = session.gameState;
  if (state) {
    drawGame(ctx, state, session.playerId);
  }
  else ctx.clearRect(0, 0, canvas.width, canvas.height);

  requestAnimationFrame(frame);
}

loadSettings();
requestAnimationFrame(frame);
