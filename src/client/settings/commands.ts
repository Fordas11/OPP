import type { Difficulty } from '../../shared/core/constants.js';
import { DEFAULT_BINDINGS, displayBinding, saveSettings, settings, type Action, type BarStyleName } from './settings.js';

/** Command pattern (ICommand): every settings change is an object that can do itself and take itself back. */
export interface Command {
  execute(): void;
  undo(): void;
  describe(): string;
}

/** Receiver: the object that really does the work. Commands only call its actions. */
export class SettingsReceiver {
  public getBinding(action: Action): string { return settings.bindings[action]; }
  public setBinding(action: Action, code: string): void { settings.bindings[action] = code; saveSettings(); }

  public getBindings(): Record<Action, string> { return { ...settings.bindings }; }
  public setBindings(bindings: Record<Action, string>): void { settings.bindings = { ...bindings }; saveSettings(); }

  public getDifficulty(): Difficulty { return settings.difficulty; }
  public setDifficulty(difficulty: Difficulty): void { settings.difficulty = difficulty; saveSettings(); }

  public getBarStyle(): BarStyleName { return settings.barStyle; }
  public setBarStyle(style: BarStyleName): void { settings.barStyle = style; saveSettings(); }
}

/** Concrete command 1: binds one action to a new key. State: the old key, for undo(). */
export class RebindCommand implements Command {
  private previous = '';
  public constructor(private readonly receiver: SettingsReceiver, private readonly action: Action, private readonly code: string) {}
  public execute(): void {
    this.previous = this.receiver.getBinding(this.action);
    this.receiver.setBinding(this.action, this.code);
  }
  public undo(): void { this.receiver.setBinding(this.action, this.previous); }
  public describe(): string { return `${this.action} -> ${displayBinding(this.code)}`; }
}

/** Concrete command 2: puts every binding back to the default. State: all old bindings. */
export class ResetBindingsCommand implements Command {
  private previous: Record<Action, string> = { ...DEFAULT_BINDINGS };
  public constructor(private readonly receiver: SettingsReceiver) {}
  public execute(): void {
    this.previous = this.receiver.getBindings();
    this.receiver.setBindings(DEFAULT_BINDINGS);
  }
  public undo(): void { this.receiver.setBindings(this.previous); }
  public describe(): string { return 'reset keybinds'; }
}

/** Concrete command 3: changes the difficulty for rooms you create. State: the old difficulty. */
export class DifficultyCommand implements Command {
  private previous: Difficulty = 'standard';
  public constructor(private readonly receiver: SettingsReceiver, private readonly difficulty: Difficulty) {}
  public execute(): void {
    this.previous = this.receiver.getDifficulty();
    this.receiver.setDifficulty(this.difficulty);
  }
  public undo(): void { this.receiver.setDifficulty(this.previous); }
  public describe(): string { return `difficulty ${this.difficulty}`; }
}

/** Concrete command 4: changes how health bars are drawn (the Bridge implementation). State: the old style. */
export class BarStyleCommand implements Command {
  private previous: BarStyleName = 'solid';
  public constructor(private readonly receiver: SettingsReceiver, private readonly style: BarStyleName) {}
  public execute(): void {
    this.previous = this.receiver.getBarStyle();
    this.receiver.setBarStyle(this.style);
  }
  public undo(): void { this.receiver.setBarStyle(this.previous); }
  public describe(): string { return `${this.style} health bars`; }
}

/** Invoker: runs commands, keeps them in a stack, and undoes the newest one. It knows only the Command interface. */
export class CommandHistory {
  private readonly done: Command[] = [];

  public run(command: Command): void {
    command.execute();
    this.done.push(command);
  }

  /** Returns the command that was undone, or undefined when there is nothing to undo. */
  public undo(): Command | undefined {
    const command = this.done.pop();
    command?.undo();
    return command;
  }

  public canUndo(): boolean { return this.done.length > 0; }
}
