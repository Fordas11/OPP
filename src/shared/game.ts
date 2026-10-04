import { DIFFICULTIES, SWING_TIME, type Difficulty } from './constants.js';
import { createEnemies, createHearts, playerSpawn } from './level.js';
import { createMazeLayout } from './maze.js';
import { distance } from './math.js';
import { canSee, hasClearLine, moveBody } from './movement.js';
import type { Enemy, GameState, Player, PlayerInput } from './types.js';
import { strategyFor } from './enemyStrategies.js';
import { EffectObserver, GameEventPublisher } from './gameEvents.js';
import { themeForLevel, visualsFrom, type ThemeFactory } from './themeFactory.js';

const NO_INPUT: PlayerInput = { up: false, down: false, left: false, right: false, aim: 0, attack: false };
const LAST_LEVEL = 5;

/** The whole co-op game. The server calls update() many times per second. */
export class Game {
  public readonly state: GameState;
  private readonly settings: { sight: number; damage: number };
  private readonly inputs = new Map<number, PlayerInput>();
  private readonly events = new GameEventPublisher();
  private theme: ThemeFactory;

  public constructor(difficulty: Difficulty, playerIds: number[]) {
    this.settings = DIFFICULTIES[difficulty];
    this.theme = themeForLevel(1);
    const layout = createMazeLayout(this.theme.mazeVariant);
    this.state = {
      level: 1,
      phase: 'playing',
      banner: 2.2,
      players: playerIds.map((id, index) => this.createPlayer(id, index)),
      enemies: createEnemies(1, layout.tiles, playerIds.length),
      maze: layout.tiles,
      iceTiles: layout.iceTiles,
      fireTiles: layout.fireTiles,
      healingTiles: layout.healingTiles,
      hearts: createHearts(1, layout.tiles, [...layout.iceTiles, ...layout.fireTiles, ...layout.healingTiles]),
      effects: [],
      theme: this.theme.id,
      themeVisuals: visualsFrom(this.theme),
    };
    this.events.subscribe(new EffectObserver(this.state, () => this.theme.createEffectAppearance().hitColor));
    for (const id of playerIds) this.inputs.set(id, { ...NO_INPUT });
  }

  /** Takes a player out of the game, for example when their browser disconnects. */
  public removePlayer(playerId: number): void {
    this.state.players = this.state.players.filter(p => p.id !== playerId);
    this.inputs.delete(playerId);
  }

  /** Stores the newest input. A click is remembered until the next update uses it. */
  public setInput(playerId: number, input: PlayerInput): void {
    const old = this.inputs.get(playerId);
    if (!old) return;
    this.inputs.set(playerId, {
      up: input.up === true,
      down: input.down === true,
      left: input.left === true,
      right: input.right === true,
      aim: Number.isFinite(input.aim) ? input.aim : 0,
      attack: old.attack || input.attack === true,
    });
  }

  public update(dt: number): void {
    const state = this.state;
    state.effects = [];
    if (state.phase !== 'playing') return;

    state.banner = Math.max(0, state.banner - dt);
    for (const player of state.players) this.updatePlayer(player, dt);
    for (const enemy of state.enemies) this.updateEnemy(enemy, dt);

    if (state.players.every(p => p.hp <= 0)) {
      state.phase = 'over';
    } else if (state.enemies.length === 0) {
      if (state.level >= LAST_LEVEL) state.phase = 'over';
      else this.startNextFloor();
    }
  }

  /** New maze, new skeletons, and everyone back in the start room (so nobody ends up inside a wall). */
  private startNextFloor(): void {
    const state = this.state;
    state.level++;
    this.theme = themeForLevel(state.level);
    state.theme = this.theme.id;
    state.themeVisuals = visualsFrom(this.theme);
    const layout = createMazeLayout(this.theme.mazeVariant);
    state.maze = layout.tiles;
    state.iceTiles = layout.iceTiles;
    state.fireTiles = layout.fireTiles;
    state.healingTiles = layout.healingTiles;
    state.hearts = createHearts(state.level, layout.tiles, [...layout.iceTiles, ...layout.fireTiles, ...layout.healingTiles]);
    state.enemies = createEnemies(state.level, state.maze, state.players.length);
    state.players.forEach((player, index) => Object.assign(player, playerSpawn(index)));
    state.banner = 2.2;
  }

  private createPlayer(id: number, index: number): Player {
    const { x, y } = playerSpawn(index);
    return { id, x, y, r: 18, hp: 6, maxHp: 6, aim: 0, attack: 0, cooldown: 0, hurt: 0, speed: 245, environmentTimer: 0 };
  }

  private updatePlayer(player: Player, dt: number): void {
    if (player.hp <= 0) return;
    const input = this.inputs.get(player.id)!;

    player.aim = input.aim;
    player.attack = Math.max(0, player.attack - dt);
    player.cooldown = Math.max(0, player.cooldown - dt);
    player.hurt = Math.max(0, player.hurt - dt);

    const dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    if (dx || dy) {
      const length = Math.hypot(dx, dy);
      const oldX = player.x; const oldY = player.y;
      moveBody(player, (dx / length) * player.speed * dt, (dy / length) * player.speed * dt, this.state.maze);
      // A player cannot walk through a skeleton: keep the previous position on collision.
      if (this.state.enemies.some(enemy => distance(player, enemy) < player.r + enemy.r)) { player.x = oldX; player.y = oldY; }
    }

    const floorResult = this.theme.createFloorRules().apply(player, this.state, dt);
    if (floorResult !== 'none') this.events.notify({ type: floorResult, x: player.x, y: player.y });
    this.collectHeart(player);

    if (input.attack) {
      input.attack = false;
      this.swingSword(player);
    }
  }

  private collectHeart(player: Player): void {
    if (player.hp >= player.maxHp) return;
    const heart = this.state.hearts.find(item => distance(player, item) < player.r + 14);
    if (!heart) return;
    player.hp = Math.min(player.maxHp, player.hp + heart.amount);
    this.state.hearts = this.state.hearts.filter(item => item !== heart);
    this.events.notify({ type: 'heart-collected', x: heart.x, y: heart.y });
  }

  private swingSword(player: Player): void {
    if (player.cooldown > 0) return;
    player.attack = SWING_TIME;
    player.cooldown = 0.35;

    const state = this.state;
    for (const enemy of state.enemies) {
      const angle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
      const inReach = distance(player, enemy) < 83 && Math.cos(angle - player.aim) > -0.15;
      if (!inReach || !hasClearLine(player, enemy, state.maze)) continue; // swords do not cut through walls

      enemy.hp--;
      enemy.hit = 0.16;
      moveBody(enemy, Math.cos(angle) * 20, Math.sin(angle) * 20, state.maze);
      this.events.notify({ type: 'enemy-hit', x: enemy.x, y: enemy.y });
    }

    state.enemies = state.enemies.filter(enemy => {
      if (enemy.hp > 0) return true;
      this.events.notify({ type: 'enemy-defeated', x: enemy.x, y: enemy.y });
      return false;
    });
  }

  private updateEnemy(enemy: Enemy, dt: number): void {
    const { maze, players } = this.state;
    enemy.hit = Math.max(0, enemy.hit - dt);
    enemy.attackTimer -= dt;

    const alive = players.filter(p => p.hp > 0);
    const visible = alive.filter(p => canSee(enemy, p, this.settings.sight, maze));
    const target = nearest(enemy, visible);

    strategyFor(enemy, target).move(enemy, { maze, target, dt });

    const victim = alive.find(p => distance(p, enemy) < 41 && p.hurt <= 0);
    if (victim && enemy.attackTimer <= 0) {
      victim.hp -= this.settings.damage;
      victim.hurt = 0.58;
      enemy.attackTimer = 1.05;
      this.events.notify({ type: 'player-hit', x: victim.x, y: victim.y });
    }
  }

}

function nearest(from: Enemy, players: Player[]): Player | undefined {
  let best: Player | undefined;
  for (const player of players) {
    if (!best || distance(from, player) < distance(from, best)) best = player;
  }
  return best;
}
