import type { GameState, Player } from '../core/types.js';

const FAST_SPEED = 450;

/** Command: a cheat that can be undone. */
export interface CheatCommand {
  execute(): void;
  undo(): void;
  describe(): string;
}

/** Receiver: changes the knight and the game. */
export class CheatReceiver {
  public constructor(private readonly player: Player, private readonly state: GameState) {}

  public getSpeed(): number { return this.player.speed; }
  public setSpeed(speed: number): void { this.player.speed = speed; }

  public isGodMode(): boolean { return this.player.godMode; }
  public setGodMode(on: boolean): void { this.player.godMode = on; }

  public getHp(): number { return this.player.hp; }
  public setHp(hp: number): void { this.player.hp = Math.min(hp, this.player.maxHp); }
  public fullHp(): number { return this.player.maxHp; }

  public areEnemiesFrozen(): boolean { return this.state.enemiesFrozen; }
  public setEnemiesFrozen(frozen: boolean): void { this.state.enemiesFrozen = frozen; }

  public announce(text: string): void {
    this.player.cheatText = text;
    this.player.cheatTimer = 2;
  }
}

/** "kkk": super speed. */
export class SpeedCheatCommand implements CheatCommand {
  private previous = 0;
  public constructor(private readonly receiver: CheatReceiver) {}
  public execute(): void {
    this.previous = this.receiver.getSpeed();
    this.receiver.setSpeed(FAST_SPEED);
  }
  public undo(): void { this.receiver.setSpeed(this.previous); }
  public describe(): string { return 'super speed'; }
}

/** "jjj": god mode. */
export class GodModeCheatCommand implements CheatCommand {
  private previous = false;
  public constructor(private readonly receiver: CheatReceiver) {}
  public execute(): void {
    this.previous = this.receiver.isGodMode();
    this.receiver.setGodMode(true);
  }
  public undo(): void { this.receiver.setGodMode(this.previous); }
  public describe(): string { return 'god mode'; }
}

/** "lll": full heal. */
export class HealCheatCommand implements CheatCommand {
  private previous = 0;
  public constructor(private readonly receiver: CheatReceiver) {}
  public execute(): void {
    this.previous = this.receiver.getHp();
    this.receiver.setHp(this.receiver.fullHp());
  }
  public undo(): void { this.receiver.setHp(this.previous); }
  public describe(): string { return 'full heal'; }
}

/** "mmm": freeze enemies. */
export class FreezeEnemiesCheatCommand implements CheatCommand {
  private previous = false;
  public constructor(private readonly receiver: CheatReceiver) {}
  public execute(): void {
    this.previous = this.receiver.areEnemiesFrozen();
    this.receiver.setEnemiesFrozen(true);
  }
  public undo(): void { this.receiver.setEnemiesFrozen(this.previous); }
  public describe(): string { return 'freeze enemies'; }
}

export const CHEAT_CODES: Record<string, (receiver: CheatReceiver) => CheatCommand> = {
  kkk: receiver => new SpeedCheatCommand(receiver),
  jjj: receiver => new GodModeCheatCommand(receiver),
  lll: receiver => new HealCheatCommand(receiver),
  mmm: receiver => new FreezeEnemiesCheatCommand(receiver),
};

/** Invoker: runs cheats and keeps an undo stack. */
export class CheatInvoker {
  private readonly done: CheatCommand[] = [];

  public run(command: CheatCommand): void {
    command.execute();
    this.done.push(command);
  }

  /** Returns the undone command, if any. */
  public undo(): CheatCommand | undefined {
    const command = this.done.pop();
    command?.undo();
    return command;
  }
}
