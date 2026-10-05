import { ARENA_HEIGHT as H } from '../shared/constants.js';
import type { GameState } from '../shared/types.js';
import { CAPE_COLORS } from './sprites.js';

const PANEL = { x: 470, y: 72, width: 470, height: 290 };
const TEXT = '#e8dcb9';
const DIM = '#9d94a8';
const TITLE = '#f3d58b';

/** Small reminder in the corner, always visible while playing. */
export function drawPatternsHint(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = DIM;
  ctx.font = '10px DM Mono';
  ctx.fillText('P: design patterns', 28, H - 2);
}

/** Shows the Adapter, Prototype and Decorator patterns working on live game data. */
export function drawPatternsPanel(ctx: CanvasRenderingContext2D, state: GameState, myId: number, adapterSent: number): void {
  ctx.fillStyle = '#0b0914ea';
  ctx.fillRect(PANEL.x, PANEL.y, PANEL.width, PANEL.height);
  ctx.strokeStyle = '#70647b';
  ctx.lineWidth = 1;
  ctx.strokeRect(PANEL.x + 0.5, PANEL.y + 0.5, PANEL.width - 1, PANEL.height - 1);

  const x = PANEL.x + 16;
  let y = PANEL.y + 24;
  const line = (text: string, color = TEXT, font = '12px DM Mono') => {
    ctx.fillStyle = color;
    ctx.font = font;
    ctx.fillText(text, x, y);
    y += 18;
  };

  line('DESIGN PATTERNS  (P closes)', TITLE, '700 14px Cinzel');
  y += 4;

  line('ADAPTER  WebSocketAdapter -> Connection.send()', TITLE);
  line(`JSON messages sent to you through it: ${adapterSent}`);
  y += 6;

  const me = state.players.find(p => p.id === myId);
  const players = [...state.players].sort((a, b) => a.id - b.id);
  line('PROTOTYPE  SWORD_PROTOTYPE.clone()', TITLE);
  if (me) {
    line(`prototype stats #${me.weapon.prototypeStatsId}   shallow copy would share #${me.weapon.shallowStatsId}`, DIM);
  }
  for (const player of players) {
    ctx.fillStyle = CAPE_COLORS[player.id % CAPE_COLORS.length];
    ctx.fillRect(x, y - 10, 9, 9);
    ctx.fillStyle = TEXT;
    ctx.font = '12px DM Mono';
    ctx.fillText(`   deep copy: sword #${player.weapon.swordId}  own stats #${player.weapon.statsId}`, x, y);
    y += 16;
  }
  y += 8;

  line('DECORATOR  your weapon', TITLE);
  if (me) {
    const steps = me.weapon.name.split(' ').reverse().join(' -> '); // "Blessed Sharp Long Sword" -> "Sword -> Long -> Sharp -> Blessed"
    line(steps);
    line(`damage ${me.weapon.damage}   reach ${me.weapon.reach}   kills ${me.kills}`);
    line('a new layer is added every 3 kills', DIM);
  }
}
