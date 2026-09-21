import { randomBetween } from '../shared/math.js';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
}

let particles: Particle[] = [];
let flashTime = 0;

export function addBurst(x: number, y: number, color: string, amount: number): void {
  for (let i = 0; i < amount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = randomBetween(35, 155);
    particles.push({
      x, y, color,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: randomBetween(0.22, 0.55),
      size: randomBetween(2, 5),
    });
  }
}

/** A short white flash of the whole screen, used when the local player is hurt. */
export function addFlash(): void {
  flashTime = 0.14;
}

export function clearEffects(): void {
  particles = [];
  flashTime = 0;
}

export function updateEffects(dt: number): void {
  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.93;
    p.vy *= 0.93;
    p.life -= dt;
  }
  particles = particles.filter(p => p.life > 0);
  flashTime = Math.max(0, flashTime - dt);
}

export function drawEffects(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  for (const p of particles) {
    ctx.globalAlpha = Math.min(1, p.life * 3);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  if (flashTime > 0) {
    ctx.globalAlpha = flashTime * 2;
    ctx.fillStyle = '#e4d8c6';
    ctx.fillRect(0, 0, width, height);
  }
  ctx.globalAlpha = 1;
}
