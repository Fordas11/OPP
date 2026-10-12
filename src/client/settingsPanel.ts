import { isDifficulty } from '../shared/constants.js';
import { BarStyleCommand, CommandHistory, DifficultyCommand, RebindCommand, ResetBindingsCommand, SettingsReceiver, type Command } from './commands.js';
import { displayBinding, isBarStyle, settings, type Action } from './settings.js';

const panel = document.querySelector<HTMLElement>('#settingsPanel')!;
const hint = document.querySelector<HTMLElement>('#bindingHint')!;
const bindingButtons = document.querySelectorAll<HTMLButtonElement>('.binding-button');
const difficultyButtons = document.querySelectorAll<HTMLButtonElement>('#difficultyOptions button');
const barStyleButtons = document.querySelectorAll<HTMLButtonElement>('#barStyleOptions button');
const undoButton = document.querySelector<HTMLButtonElement>('#undoSettings')!;
const historyHint = document.querySelector<HTMLElement>('#historyHint')!;

const DEFAULT_HINT = 'Select a binding, then press a key. Attack can also use a mouse button.';
// Command pattern: this panel is the Client. It creates commands with the receiver and gives them to the invoker.
const receiver = new SettingsReceiver();
const history = new CommandHistory();
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

/** Called for every key press. Returns true when the key was used by the settings panel. */
export function handleBindingKey(event: KeyboardEvent): boolean {
  if (isSettingsOpen() && !waitingFor && event.ctrlKey && event.code === 'KeyZ') {
    event.preventDefault();
    undo();
    return true;
  }
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

/** Called for every mouse press. Returns true when the button was used to set the attack binding. */
export function handleBindingMouse(event: MouseEvent): boolean {
  if (!waitingFor) return false;
  event.preventDefault();
  event.stopPropagation();
  if (waitingFor === 'attack') finishBinding(`Mouse${event.button}`);
  else hint.textContent = 'Movement bindings use keyboard keys.';
  return true;
}

function finishBinding(code: string): void {
  if (!waitingFor) return;
  const action = waitingFor;
  waitingFor = null;
  run(new RebindCommand(receiver, action, code));
  hint.textContent = `${displayBinding(code)} is now bound to ${action}.`;
}

function run(command: Command): void {
  history.run(command);
  historyHint.textContent = `Done: ${command.describe()}`;
  render();
}

function undo(): void {
  const command = history.undo();
  historyHint.textContent = command ? `Undone: ${command.describe()}` : 'Nothing to undo.';
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
  undoButton.disabled = !history.canUndo();
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
    const difficulty = button.dataset.difficulty;
    if (isDifficulty(difficulty) && difficulty !== settings.difficulty) run(new DifficultyCommand(receiver, difficulty));
  }),
);

barStyleButtons.forEach(button =>
  button.addEventListener('click', () => {
    const style = button.dataset.barStyle;
    if (isBarStyle(style) && style !== settings.barStyle) run(new BarStyleCommand(receiver, style));
  }),
);

document.querySelector('#resetBindings')!.addEventListener('click', () => run(new ResetBindingsCommand(receiver)));
undoButton.addEventListener('click', undo);
document.querySelector('#closeSettings')!.addEventListener('click', closeSettings);
panel.addEventListener('mousedown', event => {
  if (event.target === panel) closeSettings();
});
