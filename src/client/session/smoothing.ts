import { MOVE_STEP, TICK_RATE } from '../../shared/core/constants.js';
import { clamp, distance, type Point } from '../../shared/core/math.js';
import { movePlayer, type MoveKeys } from '../../shared/game/movement.js';
import type { GameState, Player } from '../../shared/core/types.js';

const GLIDE_TIME = (1000 / TICK_RATE) * 1.25; // ms; over 1 tick so late updates don't stall
const SNAP_DISTANCE = 80; // bigger jumps are teleports
const CORRECTION_RATE = 12; // per second

interface Glide { from: Point; to: Point; }

/** Glides other entities from their drawn position to the latest server one. */
class Interpolator {
  private glides = new Map<string, Glide>();
  private startedAt = 0;

  public update(targets: Map<string, Point>, now: number): void {
    const next = new Map<string, Glide>();
    for (const [key, target] of targets) {
      const shown = this.position(key, now) ?? target;
      const to = { x: target.x, y: target.y };
      next.set(key, { from: distance(shown, to) > SNAP_DISTANCE ? to : shown, to });
    }
    this.glides = next;
    this.startedAt = now;
  }

  public position(key: string, now: number): Point | undefined {
    const glide = this.glides.get(key);
    if (!glide) return undefined;
    const t = clamp((now - this.startedAt) / GLIDE_TIME, 0, 1);
    return { x: glide.from.x + (glide.to.x - glide.from.x) * t, y: glide.from.y + (glide.to.y - glide.from.y) * t };
  }

  public clear(): void {
    this.glides.clear();
  }
}

/** Prediction for our knight; unacked steps are replayed on each server update. */
class Prediction {
  private pending: Array<MoveKeys & { seq: number }> = [];
  private seq = 0;
  private current: Point | null = null;
  private previous: Point = { x: 0, y: 0 };
  private offset: Point = { x: 0, y: 0 }; // fading server correction

  public reset(): void {
    this.pending = [];
    this.current = null;
    this.offset = { x: 0, y: 0 };
  }

  public latest(): Point | null {
    return this.current;
  }

  /** Applies one step and returns its seq. */
  public step(keys: MoveKeys, me: Player, state: GameState): number {
    this.seq++;
    if (this.current && me.hp > 0) {
      this.pending.push({ up: keys.up, down: keys.down, left: keys.left, right: keys.right, seq: this.seq });
      this.previous = { ...this.current };
      this.current = this.move(this.current, [keys], me, state);
    }
    return this.seq;
  }

  public reconcile(me: Player, state: GameState): void {
    this.pending = this.pending.filter(move => move.seq > me.inputSeq);
    const corrected = this.move(me, this.pending, me, state);
    if (!this.current || distance(this.current, corrected) > SNAP_DISTANCE) {
      this.current = corrected;
      this.previous = { ...corrected };
      this.offset = { x: 0, y: 0 };
      return;
    }
    // Apply the error as a fading offset: no visible jump.
    const errorX = this.current.x - corrected.x;
    const errorY = this.current.y - corrected.y;
    this.current = corrected;
    this.previous = { x: this.previous.x - errorX, y: this.previous.y - errorY };
    this.offset = { x: this.offset.x + errorX, y: this.offset.y + errorY };
  }

  public position(stepProgress: number, dt: number): Point | null {
    if (!this.current) return null;
    const fade = Math.exp(-CORRECTION_RATE * dt);
    this.offset = { x: this.offset.x * fade, y: this.offset.y * fade };
    return {
      x: this.previous.x + (this.current.x - this.previous.x) * stepProgress + this.offset.x,
      y: this.previous.y + (this.current.y - this.previous.y) * stepProgress + this.offset.y,
    };
  }

  private move(from: Point, moves: MoveKeys[], me: Player, state: GameState): Point {
    const body = { x: from.x, y: from.y, r: me.r, speed: me.speed };
    for (const keys of moves) movePlayer(body, keys, MOVE_STEP, state.maze, state.enemies);
    return { x: body.x, y: body.y };
  }
}

/** Smooth per-frame positions from 30 Hz server updates. */
export class Smoothing {
  private readonly others = new Interpolator();
  private readonly me = new Prediction();

  public reset(): void {
    this.others.clear();
    this.me.reset();
  }

  public myPosition(): Point | null {
    return this.me.latest();
  }

  public step(keys: MoveKeys, me: Player, state: GameState): number {
    return this.me.step(keys, me, state);
  }

  public onState(state: GameState, myId: number, now: number): void {
    const targets = new Map<string, Point>();
    for (const player of state.players) if (player.id !== myId) targets.set(`p${player.id}`, player);
    for (const enemy of state.enemies) targets.set(`e${enemy.id}`, enemy);
    for (const arrow of state.arrows) targets.set(`a${arrow.id}`, arrow);
    this.others.update(targets, now);

    const me = state.players.find(p => p.id === myId);
    if (me) this.me.reconcile(me, state);
  }

  /** State copy with positions for this frame. */
  public view(state: GameState, myId: number, now: number, stepProgress: number, dt: number, aimFrom: (position: Point) => number): GameState {
    const mine = this.me.position(stepProgress, dt);
    const at = <T extends Point>(key: string, item: T): T => ({ ...item, ...this.others.position(key, now) });
    return {
      ...state,
      players: state.players.map(p => (p.id === myId ? (mine ? { ...p, ...mine, aim: aimFrom(mine) } : p) : at(`p${p.id}`, p))),
      enemies: state.enemies.map(e => at(`e${e.id}`, e)),
      arrows: state.arrows.map(a => at(`a${a.id}`, a)),
    };
  }
}
