import { ARENA_HEIGHT as H, ARENA_WIDTH as W } from '../../shared/core/constants.js';
import { MAX_BOUNCES, type ArrowState } from '../../shared/weapons/arrow.js';
import type { GameState, IceTile } from '../../shared/core/types.js';
import { drawEffects } from './effects.js';
import { isWall, MAZE_COLS, MAZE_LEFT, MAZE_ROWS, MAZE_TOP, TILE } from '../../shared/maze/maze.js';
import { BAR_STYLES, EnemyHealthBar, PlayerHealthBar } from './healthBars.js';
import { settings } from '../settings/settings.js';
import { CAPE_COLORS, drawKnight, drawSkeleton } from './sprites.js';

/** Draws one frame. `myId` is the local player. */
export function drawGame(ctx: CanvasRenderingContext2D, state: GameState, myId: number): void {
  const scale = ctx.canvas.width / W;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, W, H);

  drawMaze(ctx, state);
  drawTopBar(ctx, state, myId);

  const enemyBar = new EnemyHealthBar(BAR_STYLES[settings.barStyle]);
  [...state.enemies].sort((a, b) => a.y - b.y).forEach(e => {
    drawSkeleton(ctx, e, state.themeVisuals.enemyColor);
    enemyBar.draw(ctx, e.x, e.y - e.r - 18, e.hp, e.maxHp);
  });
  state.hearts.forEach(heart => drawHeart(ctx, heart.x, heart.y));
  state.arrows.forEach(arrow => drawArrow(ctx, arrow));
  for (const player of state.players) {
    if (player.hp <= 0) continue;
    drawKnight(ctx, player);
    if (player.id === myId) drawYouMarker(ctx, player.x, player.y, player.weapon.name);
    if (player.cheatTimer > 0) drawCheatText(ctx, player.x, player.y, player.cheatText);
  }

  drawEffects(ctx, W, H);
  drawBanner(ctx, state, myId);
}

// The maze is painted once per floor and copied every frame.
const mazeLayer = document.createElement('canvas');
let mazeLayerKey = '';

function drawMaze(ctx: CanvasRenderingContext2D, state: GameState): void {
  const key = [state.maze.join(''), state.themeVisuals.wallColor, ...[state.iceTiles, state.fireTiles, state.healingTiles].map(tileKeys), ctx.canvas.width].join('|');
  if (key !== mazeLayerKey) {
    mazeLayerKey = key;
    mazeLayer.width = ctx.canvas.width;
    mazeLayer.height = ctx.canvas.height;
    const layer = mazeLayer.getContext('2d')!;
    layer.setTransform(ctx.getTransform());
    paintMaze(layer, state);
  }
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(mazeLayer, 0, 0);
  ctx.restore();
}

function tileKeys(tiles: IceTile[]): string {
  return tiles.map(tile => `${tile.col},${tile.row}`).join(';');
}

function paintMaze(ctx: CanvasRenderingContext2D, state: GameState): void {
  ctx.fillStyle = '#171525';
  ctx.fillRect(0, 0, W, H);

  const floor = ctx.createLinearGradient(0, 0, W, H);
  floor.addColorStop(0, '#2a2640');
  floor.addColorStop(1, '#1c1a2d');

  const ice = new Set(tileKeys(state.iceTiles).split(';'));
  const fire = new Set(tileKeys(state.fireTiles).split(';'));
  const healing = new Set(tileKeys(state.healingTiles).split(';'));
  for (let row = 0; row < MAZE_ROWS; row++) {
    for (let col = 0; col < MAZE_COLS; col++) {
      const x = MAZE_LEFT + col * TILE;
      const y = MAZE_TOP + row * TILE;
      const tile = `${col},${row}`;
      if (isWall(state.maze, col, row)) drawWall(ctx, x, y, state.themeVisuals.wallColor);
      else drawFloorTile(ctx, x, y, floor, ice.has(tile) ? 'ice' : fire.has(tile) ? 'fire' : healing.has(tile) ? 'healing' : 'normal');
    }
  }
}

function drawFloorTile(ctx: CanvasRenderingContext2D, x: number, y: number, fill: CanvasGradient, special: 'ice' | 'fire' | 'healing' | 'normal'): void {
  ctx.fillStyle = special === 'ice' ? '#82d8ed' : special === 'fire' ? '#c84b28' : special === 'healing' ? '#5caa62' : fill;
  ctx.fillRect(x, y, TILE, TILE);
  ctx.strokeStyle = special === 'ice' ? '#d2fbff' : special === 'fire' ? '#ffbf64' : special === 'healing' ? '#b2f08f' : '#363148';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
}

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#f04462';
  ctx.beginPath();
  ctx.moveTo(0, 12);
  ctx.bezierCurveTo(-19, 0, -11, -14, 0, -6);
  ctx.bezierCurveTo(11, -14, 19, 0, 0, 12);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#ffd5dc'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.restore();
}

function drawWall(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = '#54495f'; // lighter top
  ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 12);
  ctx.strokeStyle = '#1b1725';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, TILE - 2, TILE - 2);
}

function drawTopBar(ctx: CanvasRenderingContext2D, state: GameState, myId: number): void {
  ctx.fillStyle = '#110f1af0';
  ctx.fillRect(0, 0, W, MAZE_TOP);

  ctx.fillStyle = '#e8dcb9';
  ctx.font = '700 18px Cinzel';
  ctx.fillText(`FLOOR ${state.level}`, 25, 37);

  const count = state.enemies.length;
  ctx.font = '13px DM Mono';
  ctx.fillStyle = '#b8afbd';
  ctx.fillText(`${count} SKELETON${count === 1 ? '' : 'S'} REMAIN`, 150, 36);

  const players = [...state.players].sort((a, b) => a.id - b.id);
  // Bridge: bar and style are chosen separately.
  const style = BAR_STYLES[settings.barStyle];
  players.forEach((player, index) => {
    const bar = new PlayerHealthBar(style, CAPE_COLORS[player.id % CAPE_COLORS.length], player.id === myId);
    bar.draw(ctx, 330 + index * 150, 25, player.hp, player.maxHp);
  });

  const me = state.players.find(p => p.id === myId);
  if (me) {
    ctx.textAlign = 'right';
    ctx.font = '13px DM Mono';
    ctx.fillStyle = me.ammo > 0 ? '#e8dcb9' : '#d46a5f';
    ctx.fillText(`ARROWS ${me.ammo}/${me.maxAmmo}`, W - 25, 36);
    ctx.textAlign = 'left';
  }
}

/** Gets paler with every bounce used. */
function drawArrow(ctx: CanvasRenderingContext2D, arrow: ArrowState): void {
  ctx.save();
  ctx.translate(arrow.x, arrow.y);
  ctx.rotate(arrow.angle);
  ctx.strokeStyle = '#e5d6a2';
  ctx.globalAlpha = 0.55 + 0.45 * (arrow.bouncesLeft / MAX_BOUNCES);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-12, 0);
  ctx.lineTo(8, 0);
  ctx.stroke();
  ctx.fillStyle = '#f4f0e0';
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(6, -4);
  ctx.lineTo(6, 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawYouMarker(ctx: CanvasRenderingContext2D, x: number, y: number, weapon: string): void {
  ctx.fillStyle = '#f3d58b';
  ctx.font = '11px DM Mono';
  ctx.textAlign = 'center';
  ctx.fillText('YOU', x, y - 34);
  ctx.fillText(weapon, x, y - 46);
  ctx.textAlign = 'left';
}

function drawCheatText(ctx: CanvasRenderingContext2D, x: number, y: number, text: string): void {
  ctx.fillStyle = '#7ef0c8';
  ctx.font = '700 12px DM Mono';
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y - 60);
  ctx.textAlign = 'left';
}

function drawBanner(ctx: CanvasRenderingContext2D, state: GameState, myId: number): void {
  ctx.textAlign = 'center';

  if (state.banner > 0) {
    ctx.globalAlpha = Math.min(1, state.banner * 2);
    ctx.fillStyle = '#0b0914d0'; // backing for readability
    ctx.fillRect(W / 2 - 110, 62, 220, 46);
    ctx.font = '800 36px Cinzel';
    ctx.fillStyle = '#f2d98d';
    ctx.fillText(`FLOOR ${state.level}`, W / 2, 96);
    ctx.globalAlpha = 1;
  }

  const me = state.players.find(p => p.id === myId);
  if (me && me.hp <= 0 && state.phase === 'playing') {
    ctx.font = '13px DM Mono';
    ctx.fillStyle = '#d0c6cf';
    ctx.fillText('YOU HAVE FALLEN - WATCHING YOUR TEAM', W / 2, H - 20);
  }

  ctx.textAlign = 'left';
}
