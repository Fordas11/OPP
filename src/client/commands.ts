import type { Vector2 } from '../shared/protocol';
import { Knight } from './entities';

export interface GameCommand { execute(): void; undo(): void; }

export class MoveCommand implements GameCommand {
  private previous?: Vector2;
  public constructor(private readonly knight: Knight, private readonly destination: Vector2) {}
  public execute(): void { this.previous = { ...this.knight.position }; this.knight.position = { ...this.destination }; }
  public undo(): void { if (this.previous) this.knight.position = this.previous; }
}

export class AttackCommand implements GameCommand {
  private previousAim = 0;
  public constructor(private readonly knight: Knight, private readonly aim: number) {}
  public execute(): void { this.previousAim = this.knight.aim; this.knight.aim = this.aim; }
  public undo(): void { this.knight.aim = this.previousAim; }
}

/** Command pattern with undo history, ready for replay and multiplayer input sequences. */
export class CommandHistory {
  private readonly done: GameCommand[] = [];
  public run(command: GameCommand): void { command.execute(); this.done.push(command); }
  public undo(): void { this.done.pop()?.undo(); }
}
