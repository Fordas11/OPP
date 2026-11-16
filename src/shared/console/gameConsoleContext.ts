import type { CheatReceiver } from '../cheats/cheats.js';
import { MAX_SHIELD } from '../core/constants.js';
import { distance } from '../core/math.js';
import type { GameState, Player } from '../core/types.js';
import { EnemyFactory, type EnemyKind } from '../enemies/enemyFactory.js';
import { cellCenters } from '../maze/maze.js';
import type { ConsoleContext } from './interpreter.js';

const MIN_SPAWN_DISTANCE = 150; // do not spawn on top of the knight

/** Lets console commands change one knight and the game. Collects the answer lines. */
export class GameConsoleContext implements ConsoleContext {
  public readonly lines: string[] = [];
  private readonly factory = new EnemyFactory();

  public constructor(private readonly player: Player, private readonly state: GameState, private readonly receiver: CheatReceiver) {}

  public say(text: string): void { this.lines.push(text); }
  public heal(): void { this.receiver.setHp(this.receiver.fullHp()); }
  public setSpeed(speed: number): void { this.receiver.setSpeed(speed); }
  public setGodMode(on: boolean): void { this.receiver.setGodMode(on); }
  public setEnemiesFrozen(on: boolean): void { this.receiver.setEnemiesFrozen(on); }

  public spawn(kind: EnemyKind, count: number): void {
    const cells = cellCenters(this.state.maze);
    const farCells = cells.filter(cell => distance(cell, this.player) >= MIN_SPAWN_DISTANCE);
    const spots = farCells.length > 0 ? farCells : cells;
    for (let i = 0; i < count; i++) {
      const spot = spots[Math.floor(Math.random() * spots.length)];
      this.state.enemies.push(this.factory.create(kind, spot, this.state.level));
    }
  }

  public giveArrows(amount: number): void { this.player.ammo = Math.min(this.player.maxAmmo, this.player.ammo + amount); }
  public giveShield(amount: number): void { this.player.shield = Math.min(MAX_SHIELD, this.player.shield + amount); }
}
