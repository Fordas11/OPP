import { ARENA_HEIGHT, ARENA_WIDTH } from '../../shared/core/constants.js';
import type { Point } from '../../shared/core/math.js';
import type { PlayerInput } from '../../shared/core/types.js';
import { settings } from '../settings/settings.js';

/** Facade subsystem: the keys held down and where the mouse is. */
export class InputState {
  private readonly pressedKeys = new Set<string>();
  private readonly mouse: Point = { x: 0, y: 0 }; // in arena coordinates
  private attackRequested = false;
  private shootRequested = false;

  public pressKey(code: string): void {
    this.pressedKeys.add(code);
    if (code === settings.bindings.attack) this.attackRequested = true;
    if (code === settings.bindings.shoot) this.shootRequested = true;
  }

  public releaseKey(code: string): void {
    this.pressedKeys.delete(code);
  }

  public releaseAllKeys(): void {
    this.pressedKeys.clear();
  }

  public requestAttack(): void {
    this.attackRequested = true;
  }

  public requestShoot(): void {
    this.shootRequested = true;
  }

  /** Remembers where the mouse is inside the arena. */
  public moveMouse(event: MouseEvent, canvas: HTMLCanvasElement): void {
    const bounds = canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - bounds.left) * ARENA_WIDTH) / bounds.width;
    this.mouse.y = ((event.clientY - bounds.top) * ARENA_HEIGHT) / bounds.height;
  }

  /** Builds the input message for a player standing at `position`. */
  public readInput(position: Point): PlayerInput {
    const { bindings } = settings;
    const input: PlayerInput = {
      up: this.pressedKeys.has(bindings.up),
      down: this.pressedKeys.has(bindings.down),
      left: this.pressedKeys.has(bindings.left),
      right: this.pressedKeys.has(bindings.right),
      aim: Math.atan2(this.mouse.y - position.y, this.mouse.x - position.x),
      attack: this.attackRequested,
      shoot: this.shootRequested,
    };
    this.attackRequested = false;
    this.shootRequested = false;
    return input;
  }
}
