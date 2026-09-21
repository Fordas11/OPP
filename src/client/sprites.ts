import { SWING_TIME } from '../shared/constants.js';
import type { Enemy, Player } from '../shared/types.js';

export const CAPE_COLORS = ['#9f3e43', '#3e6b9f', '#3e9f5a', '#c9a23a']; // red, blue, green, yellow: one per player
const SWORD_LENGTH = 46;
const SWING_ARC = 1.7; // radians to each side of the aim, matches the hit area on the server

export function drawSkeleton(ctx: CanvasRenderingContext2D, e: Enemy): void {
  const bounce = Math.sin(performance.now() / 170 + e.wobble) * 2;
  ctx.save();
  ctx.translate(e.x, e.y + bounce);
  ctx.globalAlpha = e.hit ? 0.45 : 1;

  ctx.fillStyle = '#0b0911aa';
  ctx.beginPath();
  ctx.ellipse(0, 18, 18, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // skull
  ctx.strokeStyle = '#d8d1bb';
  ctx.fillStyle = '#c9c1aa';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, -11, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#271f28';
  ctx.beginPath();
  ctx.arc(-4, -12, 3.5, 0, 7);
  ctx.arc(5, -12, 3.5, 0, 7);
  ctx.fill();

  // bones
  ctx.beginPath();
  ctx.moveTo(0, -1); ctx.lineTo(-7, 16);
  ctx.moveTo(0, -1); ctx.lineTo(8, 16);
  ctx.moveTo(-6, 7); ctx.lineTo(7, 7);
  ctx.moveTo(-5, 2); ctx.lineTo(-14, 12);
  ctx.moveTo(5, 2); ctx.lineTo(14, 11);
  ctx.moveTo(-7, 16); ctx.lineTo(-10, 25);
  ctx.moveTo(8, 16); ctx.lineTo(11, 25);
  ctx.stroke();
  ctx.restore();

  if (e.hp < e.maxHp) {
    ctx.fillStyle = '#2b2430';
    ctx.fillRect(e.x - 15, e.y - 34, 30, 4);
    ctx.fillStyle = '#b94c49';
    ctx.fillRect(e.x - 15, e.y - 34, (30 * e.hp) / e.maxHp, 4);
  }
}

export function drawKnight(ctx: CanvasRenderingContext2D, p: Player): void {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.globalAlpha = p.hurt && Math.floor(p.hurt * 15) % 2 ? 0.35 : 1;

  ctx.fillStyle = '#0a0911aa';
  ctx.beginPath();
  ctx.ellipse(0, 20, 20, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // The body never rotates: only the cape swaps sides as the aim crosses the knight.
  const capeSide = Math.cos(p.aim) >= 0 ? -1 : 1;
  ctx.fillStyle = CAPE_COLORS[p.id % CAPE_COLORS.length];
  ctx.beginPath();
  ctx.moveTo(capeSide * 10, -10);
  ctx.lineTo(capeSide * 31, 4);
  ctx.lineTo(capeSide * 16, 13);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#c5cbd4';
  ctx.beginPath();
  ctx.arc(0, -8, 13, Math.PI, 0);
  ctx.lineTo(13, 11);
  ctx.lineTo(-13, 11);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#454b58';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#d5d8d5';
  ctx.fillRect(-9, 5, 18, 17);
  ctx.strokeRect(-9, 5, 18, 17);

  const faceSide = Math.cos(p.aim) >= 0 ? 1 : -1;
  ctx.fillStyle = '#24303c';
  ctx.fillRect(faceSide * 3, -11, 3, 4);
  ctx.fillRect(faceSide * 8, -11, 3, 4);

  drawSword(ctx, p);
  ctx.restore();
}

/** The sword points at the mouse. During an attack it sweeps across in a slash. */
function drawSword(ctx: CanvasRenderingContext2D, p: Player): void {
  const swinging = p.attack > 0;
  const progress = swinging ? 1 - p.attack / SWING_TIME : 0; // 0 at the start of the swing, 1 at the end
  const eased = 1 - (1 - progress) ** 2; // fast start, slow finish
  const startAngle = p.aim - SWING_ARC;
  const angle = swinging ? startAngle + 2 * SWING_ARC * eased : p.aim;

  ctx.save();
  ctx.translate(3, 4);

  if (swinging) {
    ctx.strokeStyle = `rgba(245, 236, 200, ${0.65 * (1 - progress)})`;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, SWORD_LENGTH - 4, startAngle, angle);
    ctx.stroke();
    ctx.lineCap = 'butt';
  }

  ctx.rotate(angle);
  ctx.strokeStyle = '#e5d6a2';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(7, 0);
  ctx.lineTo(SWORD_LENGTH, 0);
  ctx.stroke();
  ctx.strokeStyle = '#6b422b';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(9, -7);
  ctx.lineTo(9, 7);
  ctx.stroke();
  ctx.restore();
}
