import { TICK_RATE } from '../shared/constants.js';
import { KeyboardController, MenuController } from './controllers.js';
import { updateEffects } from './effects.js';
import { drawPatternsHint, drawPatternsPanel } from './patternsPanel.js';
import { drawGame } from './render.js';
import { GameSession } from './session.js';
import { loadSettings } from './settings.js';

const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const ctx = canvas.getContext('2d')!;

// Facade: both controllers use the same GameSession and nothing behind it.
const session = new GameSession();
new MenuController(session);
const keyboard = new KeyboardController(session, canvas);

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
    drawPatternsHint(ctx);
    if (keyboard.showPatterns) drawPatternsPanel(ctx, state, session.playerId, session.messagesFromAdapter);
  }
  else ctx.clearRect(0, 0, canvas.width, canvas.height);

  requestAnimationFrame(frame);
}

loadSettings();
requestAnimationFrame(frame);
