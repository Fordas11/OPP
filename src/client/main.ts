import { MOVE_STEP } from '../shared/core/constants.js';
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

// ---------- Main loop ----------

let lastTime = performance.now();
let stepTime = 0; // time not yet used by a movement step

function frame(time: number): void {
  const elapsed = (time - lastTime) / 1000;
  lastTime = time;

  // Fixed movement steps at the server tick rate.
  stepTime = Math.min(stepTime + elapsed, 0.25); // no burst after a pause
  while (stepTime >= MOVE_STEP) {
    session.sendInput();
    stepTime -= MOVE_STEP;
  }

  const dt = Math.min(0.05, elapsed);
  updateEffects(dt);
  const state = session.frameState(time, stepTime / MOVE_STEP, dt);
  if (state) drawGame(ctx, state, session.playerId);
  else ctx.clearRect(0, 0, canvas.width, canvas.height);

  requestAnimationFrame(frame);
}

loadSettings();
requestAnimationFrame(frame);
