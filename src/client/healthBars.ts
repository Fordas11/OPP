import type { BarStyleName } from './settings.js';

/**
 * Bridge pattern, implementation side: HOW a bar is painted.
 * It only knows a rectangle and a fill amount, not whose health it is.
 */
export interface BarStyle {
  paint(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, hp: number, maxHp: number, color: string): void;
}

/** Concrete implementation 1: one smooth bar. */
export class SolidBarStyle implements BarStyle {
  public paint(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, hp: number, maxHp: number, color: string): void {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width * Math.max(0, hp) / maxHp, height);
  }
}

/** Concrete implementation 2: one block for every hit point. */
export class SegmentedBarStyle implements BarStyle {
  public paint(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, hp: number, maxHp: number, color: string): void {
    const gap = 2;
    const block = (width - gap * (maxHp - 1)) / maxHp;
    for (let i = 0; i < maxHp; i++) {
      ctx.fillStyle = i < hp ? color : '#00000055';
      ctx.fillRect(x + i * (block + gap), y, block, height);
    }
  }
}

export const BAR_STYLES: Record<BarStyleName, BarStyle> = { solid: new SolidBarStyle(), segmented: new SegmentedBarStyle() };

/**
 * Bridge pattern, abstraction side: WHAT bar is drawn and where.
 * It holds a BarStyle and hands the painting over to it, so any bar works with any style.
 */
export abstract class HealthBar {
  public constructor(protected style: BarStyle) {}
  public setStyle(style: BarStyle): void { this.style = style; }
  public abstract draw(ctx: CanvasRenderingContext2D, x: number, y: number, hp: number, maxHp: number): void;
}

/** Refined abstraction 1: a player's bar in the top bar, with a color swatch and a gold outline for yourself. */
export class PlayerHealthBar extends HealthBar {
  public constructor(style: BarStyle, private readonly color: string, private readonly isMe: boolean) { super(style); }
  public draw(ctx: CanvasRenderingContext2D, x: number, y: number, hp: number, maxHp: number): void {
    ctx.fillStyle = this.color;
    ctx.fillRect(x, y + 1, 10, 10); // color swatch, matches the knight's cape
    ctx.fillStyle = '#312939';
    ctx.fillRect(x + 16, y, 105, 12);
    this.style.paint(ctx, x + 18, y + 2, 101, 8, hp, maxHp, this.color);
    ctx.strokeStyle = this.isMe ? '#f3d58b' : '#938071';
    ctx.lineWidth = this.isMe ? 2 : 1;
    ctx.strokeRect(x + 16.5, y - 0.5, 105, 13);
  }
}

/** Refined abstraction 2: a small bar above a hurt enemy, centered on it. */
export class EnemyHealthBar extends HealthBar {
  public draw(ctx: CanvasRenderingContext2D, x: number, y: number, hp: number, maxHp: number): void {
    ctx.fillStyle = '#2b2430';
    ctx.fillRect(x - 15, y, 30, 4);
    this.style.paint(ctx, x - 15, y, 30, 4, hp, maxHp, '#b94c49');
  }
}
