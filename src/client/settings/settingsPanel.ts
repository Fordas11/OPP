import { isDifficulty } from '../../shared/core/constants.js';
import { displayBinding, isBarStyle, saveSettings, settings, type Action } from './settings.js';

const panel = document.querySelector<HTMLElement>('#settingsPanel')!;
const hint = document.querySelector<HTMLElement>('#bindingHint')!;
const bindingButtons = document.querySelectorAll<HTMLButtonElement>('.binding-button');
const difficultyButtons = document.querySelectorAll<HTMLButtonElement>('#difficultyOptions button');
const barStyleButtons = document.querySelectorAll<HTMLButtonElement>('#barStyleOptions button');

const DEFAULT_HINT = 'Select a binding, then press a key. Attack and bow can also use a mouse button.';
let waitingFor: Action | null = null;

export function isSettingsOpen(): boolean {
  return !panel.classList.contains('hidden');
}

export function openSettings(): void {
  waitingFor = null;
  hint.textContent = DEFAULT_HINT;
  render();
  panel.classList.remove('hidden');
}

export function closeSettings(): void {
  waitingFor = null;
  panel.classList.add('hidden');
}

/** True if the key was used for a binding. */
export function handleBindingKey(event: KeyboardEvent): boolean {
  if (!waitingFor) return false;
  event.preventDefault();
  if (event.code === 'Escape') {
    waitingFor = null;
    hint.textContent = 'Binding change cancelled.';
    render();
  } else {
    finishBinding(event.code);
  }
  return true;
}

/** True if the click was used for a binding. */
export function handleBindingMouse(event: MouseEvent): boolean {
  if (!waitingFor) return false;
  event.preventDefault();
  event.stopPropagation();
  if (waitingFor === 'attack' || waitingFor === 'shoot') finishBinding(`Mouse${event.button}`);
  else hint.textContent = 'Movement bindings use keyboard keys.';
  return true;
}

function finishBinding(code: string): void {
  if (!waitingFor) return;
  settings.bindings[waitingFor] = code;
  hint.textContent = `${displayBinding(code)} is now bound to ${waitingFor}.`;
  waitingFor = null;
  saveSettings();
  render();
}

function render(): void {
  bindingButtons.forEach(button => {
    const action = button.dataset.bind as Action;
    button.textContent = waitingFor === action ? 'Press a key…' : displayBinding(settings.bindings[action]);
    button.classList.toggle('listening', waitingFor === action);
  });
  difficultyButtons.forEach(button => {
    button.classList.toggle('active', button.dataset.difficulty === settings.difficulty);
  });
  barStyleButtons.forEach(button => {
    button.classList.toggle('active', button.dataset.barStyle === settings.barStyle);
  });
}

bindingButtons.forEach(button =>
  button.addEventListener('click', () => {
    waitingFor = button.dataset.bind as Action;
    hint.textContent = `Press a key for ${waitingFor}. Escape cancels.`;
    render();
  }),
);

difficultyButtons.forEach(button =>
  button.addEventListener('click', () => {
    if (!isDifficulty(button.dataset.difficulty)) return;
    settings.difficulty = button.dataset.difficulty;
    saveSettings();
    render();
  }),
);

barStyleButtons.forEach(button =>
  button.addEventListener('click', () => {
    if (!isBarStyle(button.dataset.barStyle)) return;
    settings.barStyle = button.dataset.barStyle;
    saveSettings();
    render();
  }),
);

document.querySelector('#closeSettings')!.addEventListener('click', closeSettings);
panel.addEventListener('mousedown', event => {
  if (event.target === panel) closeSettings();
});
