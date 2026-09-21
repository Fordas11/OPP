import { DIFFICULTIES, SWING_TIME, type Difficulty } from './constants.js';
import { createEnemies, playerSpawn } from './level.js';
import { createMaze } from './maze.js';
import { distance, randomBetween } from './math.js';
import { canSee, hasClearLine, moveBody } from './movement.js';
import type { Enemy, GameState, Player, PlayerInput } from './types.js';

const NO_INPUT: PlayerInput = { up: false, down: false, left: false, right: false, aim: 0, attack: false };

/** The whole co-op game. The server calls update() many times per second. */
export class Game {
  public readonly state: GameState;
  private readonly settings: { sight: number; damage: number };
  private readonly inputs = new Map<number, PlayerInput>();

  public constructor(difficulty: Difficulty, playerIds: number[]) {
    this.settings = DIFFICULTIES[difficulty];
    const maze = createMaze();
    this.state = {
      level: 1,
      phase: 'playing',
      banner: 2.2,
      players: playerIds.map((id, index) => this.createPlayer(id, index)),
      enemies: createEnemies(1, maze, playerIds.length),
      maze,
      effects: [],
    };
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
      this.startNextFloor();
    }
  }

  /** New maze, new skeletons, and everyone back in the start room (so nobody ends up inside a wall). */
  private startNextFloor(): void {
    const state = this.state;
    state.level++;
    state.maze = createMaze();
    state.enemies = createEnemies(state.level, state.maze, state.players.length);
    state.players.forEach((player, index) => Object.assign(player, playerSpawn(index)));
    state.banner = 2.2;
  }

  private createPlayer(id: number, index: number): Player {
    const { x, y } = playerSpawn(index);
    return { id, x, y, r: 18, hp: 6, maxHp: 6, aim: 0, attack: 0, cooldown: 0, hurt: 0, speed: 245 };
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
      moveBody(player, (dx / length) * player.speed * dt, (dy / length) * player.speed * dt, this.state.maze);
    }

    if (input.attack) {
      input.attack = false;
      this.swingSword(player);
    }
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
      this.addEffect(enemy.x, enemy.y, '#ded6bf', 7);
    }

    state.enemies = state.enemies.filter(enemy => {
      if (enemy.hp > 0) return true;
      this.addEffect(enemy.x, enemy.y, '#d9d0b9', 18);
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

    if (target) {
      const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
      if (distance(target, enemy) > 38) {
        moveBody(enemy, Math.cos(angle) * enemy.speed * dt, Math.sin(angle) * enemy.speed * dt, maze);
      }
    } else {
      this.wander(enemy, dt);
    }

    const victim = alive.find(p => distance(p, enemy) < 41 && p.hurt <= 0);
    if (victim && enemy.attackTimer <= 0) {
      victim.hp -= this.settings.damage;
      victim.hurt = 0.58;
      enemy.attackTimer = 1.05;
      this.addEffect(victim.x, victim.y, '#b74843', 10);
    }
  }

  private wander(enemy: Enemy, dt: number): void {
    enemy.wanderTime -= dt;
    if (enemy.wanderTime <= 0) {
      enemy.wanderAngle = Math.random() * Math.PI * 2;
      enemy.wanderTime = randomBetween(0.55, 1.8);
    }
    const oldX = enemy.x;
    const oldY = enemy.y;
    const step = enemy.speed * 0.48 * dt;
    moveBody(enemy, Math.cos(enemy.wanderAngle) * step, Math.sin(enemy.wanderAngle) * step, this.state.maze);
    if (enemy.x === oldX && enemy.y === oldY) enemy.wanderTime = 0; // blocked: pick a new direction
  }

  private addEffect(x: number, y: number, color: string, amount: number): void {
    this.state.effects.push({ x, y, color, amount });
  }
}

function nearest(from: Enemy, players: Player[]): Player | undefined {
  let best: Player | undefined;
  for (const player of players) {
    if (!best || distance(from, player) < distance(from, best)) best = player;
  }
  return best;
}
