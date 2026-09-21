import { MAX_PLAYERS, TICK_RATE } from '../shared/constants.js';
import type { ServerMessage } from '../shared/messages.js';
import type { GameState } from '../shared/types.js';
import { addBurst, addFlash, clearEffects, updateEffects } from './effects.js';
import { moveMouse, pressKey, readInput, releaseAllKeys, releaseKey, requestAttack } from './input.js';
import * as network from './network.js';
import { drawGame } from './render.js';
import { currentScreen, setText, showScreen } from './screens.js';
import { loadSettings, settings } from './settings.js';
import { closeSettings, handleBindingKey, handleBindingMouse, isSettingsOpen, openSettings } from './settingsPanel.js';

const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const ctx = canvas.getContext('2d')!;
const codeInput = document.querySelector<HTMLInputElement>('#codeInput')!;
const startGameButton = document.querySelector<HTMLElement>('#startGameButton')!;
let myId = 0;
let state: GameState | null = null;

// ---------- Messages from the server ----------

function onServerMessage(message: ServerMessage): void {
  switch (message.type) {
    case 'lobby':
      showLobby(message);
      break;
    case 'game-started':
      myId = message.you;
      state = null;
      clearEffects();
      showScreen('playing');
      break;
    case 'state':
      onState(message.state);
      break;
    case 'error':
      setText('#menuMessage', message.message);
      break;
  }
}

function showLobby(lobby: Extract<ServerMessage, { type: 'lobby' }>): void {
  setText('#roomCode', lobby.code);
  setText('#lobbyPlayers', `Players: ${lobby.players} / ${MAX_PLAYERS}`);
  setText('#lobbyHint', lobby.isHost ? 'Press Start Game when everyone has joined.' : 'Waiting for the host to start the game...');
  startGameButton.classList.toggle('hidden', !lobby.isHost);
  showScreen('waiting');
}

function onState(next: GameState): void {
  const before = state?.players.find(p => p.id === myId);
  const after = next.players.find(p => p.id === myId);
  if (before && after && after.hp < before.hp) addFlash();
  for (const effect of next.effects) addBurst(effect.x, effect.y, effect.color, effect.amount);

  state = next;
  if (next.phase === 'over' && currentScreen() !== 'over') {
    setText('#finalLevel', `You reached floor ${next.level}.`);
    releaseAllKeys();
    showScreen('over');
  }
}

// ---------- Menu actions ----------

async function connectToServer(): Promise<boolean> {
  if (network.isConnected()) return true;
  try {
    await network.connect(onServerMessage, () => backToMenu('Connection to the server was lost.'));
    return true;
  } catch {
    setText('#menuMessage', 'Cannot reach the server.');
    return false;
  }
}

async function createRoom(): Promise<void> {
  setText('#menuMessage', '');
  if (await connectToServer()) network.send({ type: 'create-room', difficulty: settings.difficulty });
}

async function joinRoom(): Promise<void> {
  const code = codeInput.value.trim().toUpperCase();
  if (code.length !== 4) return setText('#menuMessage', 'Enter the 4-letter room code.');
  setText('#menuMessage', '');
  if (await connectToServer()) network.send({ type: 'join-room', code });
}

function backToMenu(message = ''): void {
  network.disconnect();
  state = null;
  releaseAllKeys();
  clearEffects();
  setText('#menuMessage', message);
  showScreen('menu');
}

function togglePauseMenu(): void {
  if (currentScreen() === 'playing') {
    releaseAllKeys();
    showScreen('pause');
  } else if (currentScreen() === 'pause') {
    showScreen('playing');
  }
}

function on(selector: string, action: () => void): void {
  document.querySelector(selector)!.addEventListener('click', action);
}

on('#createButton', createRoom);
on('#joinButton', joinRoom);
on('#menuSettingsButton', openSettings);
on('#startGameButton', () => network.send({ type: 'start-game' }));
on('#cancelButton', () => backToMenu());
on('#resumeButton', togglePauseMenu);
on('#pauseSettingsButton', openSettings);
on('#leaveButton', () => backToMenu());
on('#gameOverLeaveButton', () => backToMenu());
on('#restartButton', () => network.send({ type: 'restart' }));

// ---------- Keyboard and mouse ----------

window.addEventListener('keydown', event => {
  if (handleBindingKey(event)) return;

  if (event.code === 'Escape') {
    event.preventDefault();
    if (isSettingsOpen()) closeSettings();
    else togglePauseMenu();
    return;
  }
  if (currentScreen() !== 'playing') return;

  event.preventDefault();
  pressKey(event.code);
});

window.addEventListener('keyup', event => releaseKey(event.code));
window.addEventListener('blur', releaseAllKeys);

// The capture phase lets the settings panel take the click before anything else.
window.addEventListener('mousedown', handleBindingMouse, true);

canvas.addEventListener('mousemove', event => moveMouse(event, canvas));
canvas.addEventListener('mousedown', event => {
  if (currentScreen() !== 'playing' || `Mouse${event.button}` !== settings.bindings.attack) return;
  event.preventDefault();
  requestAttack();
});
canvas.addEventListener('contextmenu', event => event.preventDefault());

// ---------- Main loops ----------

// Send our input to the server as often as the server runs its ticks.
setInterval(() => {
  const me = state?.players.find(p => p.id === myId);
  if (me && state?.phase === 'playing') network.send({ type: 'input', input: readInput(me) });
}, 1000 / TICK_RATE);

let lastTime = performance.now();
function frame(time: number): void {
  const dt = Math.min(0.05, (time - lastTime) / 1000);
  lastTime = time;

  updateEffects(dt);
  if (state) drawGame(ctx, state, myId);
  else ctx.clearRect(0, 0, canvas.width, canvas.height);

  requestAnimationFrame(frame);
}

loadSettings();
requestAnimationFrame(frame);
