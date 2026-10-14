import { DIFFICULTIES, SWING_TIME, type Difficulty } from '../core/constants.js';
import { createEnemies, createHearts, playerSpawn } from './level.js';
import { createMazeLayout, isWallAt } from '../maze/maze.js';
import { distance } from '../core/math.js';
import { ARROW_PROTOTYPE, SPLIT_ANGLE, SPLIT_FROM_LEVEL, type Arrow } from '../weapons/arrow.js';
import { canSee, hasClearLine, moveBody } from './movement.js';
import type { Enemy, GameState, Player, PlayerInput } from '../core/types.js';
import { strategyFor } from '../enemies/enemyStrategies.js';
import { EffectObserver, GameEventPublisher } from '../events/gameEvents.js';
import { themeForLevel, visualsFrom, type ThemeFactory } from '../themes/themeFactory.js';
import { Sword, UPGRADES, type Weapon } from '../weapons/weapon.js';

const NO_INPUT: PlayerInput = { up: false, down: false, left: false, right: false, aim: 0, attack: false, shoot: false };
const LAST_LEVEL = 5;
const KILLS_PER_UPGRADE = 3;
const MAX_AMMO = 20;
const SHOOT_COOLDOWN = 0.3;
const ARROW_STEP = 8; // arrows move in small steps so they cannot jump through a wall

/** The whole co-op game. The server calls update() many times per second. */
export class Game {
  public readonly state: GameState;
  private readonly settings: { sight: number; damage: number };
  private readonly inputs = new Map<number, PlayerInput>();
  private readonly events = new GameEventPublisher();
  private readonly weapons = new Map<number, Weapon>(); // each player's current weapon (with upgrades)
  private readonly upgradesEarned = new Map<number, number>(); // how many upgrades each weapon already has
  private arrows: Arrow[] = [];
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
      enemies: createEnemies(1, layout.tiles, playerIds.length, layout.fireTiles),
      maze: layout.tiles,
      iceTiles: layout.iceTiles,
      fireTiles: layout.fireTiles,
      healingTiles: layout.healingTiles,
      hearts: createHearts(1, layout.tiles, [...layout.iceTiles, ...layout.fireTiles, ...layout.healingTiles]),
      effects: [],
      arrows: [],
      theme: this.theme.id,
      themeVisuals: visualsFrom(this.theme),
    };
    this.events.subscribe(new EffectObserver(this.state, () => this.theme.createEffectAppearance().hitColor));
    for (const id of playerIds) {
      this.inputs.set(id, { ...NO_INPUT });
      this.weapons.set(id, new Sword());
    }
    this.state.players.forEach(player => this.describeWeapon(player));
  }

  /** Takes a player out of the game, for example when their browser disconnects. */
  public removePlayer(playerId: number): void {
    this.state.players = this.state.players.filter(p => p.id !== playerId);
    this.inputs.delete(playerId);
    this.weapons.delete(playerId);
    this.upgradesEarned.delete(playerId);
    this.arrows = this.arrows.filter(arrow => arrow.ownerId !== playerId);
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
      shoot: old.shoot || input.shoot === true,
    });
  }

  public update(dt: number): void {
    const state = this.state;
    state.effects = [];
    if (state.phase !== 'playing') return;

    state.banner = Math.max(0, state.banner - dt);
    for (const player of state.players) this.updatePlayer(player, dt);
    this.updateArrows(dt);
    state.arrows = this.arrows;
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
    state.enemies = createEnemies(state.level, state.maze, state.players.length, layout.fireTiles);
    state.players.forEach((player, index) => Object.assign(player, playerSpawn(index), { ammo: player.maxAmmo })); // ammo comes back every floor
    this.arrows = [];
    state.arrows = [];
    state.banner = 2.2;
  }

  /** Decorator: every few kills wrap the player's weapon in one more upgrade, so each knight's weapon is different. */
  private upgradeWeapon(player: Player): void {
    const earned = Math.min(Math.floor(player.kills / KILLS_PER_UPGRADE), UPGRADES.length);
    let have = this.upgradesEarned.get(player.id) ?? 0;
    while (have < earned) {
      const Upgrade = UPGRADES[have++];
      this.weapons.set(player.id, new Upgrade(this.weapons.get(player.id)!));
    }
    this.upgradesEarned.set(player.id, have);
    this.describeWeapon(player);
  }

  /** Copies the weapon's numbers into the player, so the browsers can show them. */
  private describeWeapon(player: Player): void {
    const weapon = this.weapons.get(player.id)!;
    player.weapon = { name: weapon.name(), damage: weapon.damage(), reach: weapon.reach() };
  }

  private createPlayer(id: number, index: number): Player {
    const { x, y } = playerSpawn(index);
    return { id, x, y, r: 18, hp: 6, maxHp: 6, aim: 0, attack: 0, cooldown: 0, hurt: 0, speed: 245, environmentTimer: 0, kills: 0, weapon: { name: '', damage: 0, reach: 0 }, ammo: MAX_AMMO, maxAmmo: MAX_AMMO };
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
    if (input.shoot) {
      input.shoot = false;
      this.shootArrow(player);
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
    const weapon = this.weapons.get(player.id)!;
    for (const enemy of state.enemies) {
      const angle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
      const inReach = distance(player, enemy) < weapon.reach() && Math.cos(angle - player.aim) > -0.15;
      if (!inReach || !hasClearLine(player, enemy, state.maze)) continue; // swords do not cut through walls

      enemy.hp -= weapon.damage();
      enemy.hit = 0.16;
      moveBody(enemy, Math.cos(angle) * 20, Math.sin(angle) * 20, state.maze);
      this.events.notify({ type: 'enemy-hit', x: enemy.x, y: enemy.y });
    }

    this.creditKills(player);
  }

  /** Removes skeletons that just died and gives the kills (and weapon upgrades) to the knight who caused them. */
  private creditKills(player: Player): void {
    const state = this.state;
    const before = state.enemies.length;
    state.enemies = state.enemies.filter(enemy => {
      if (enemy.hp > 0) return true;
      this.events.notify({ type: 'enemy-defeated', x: enemy.x, y: enemy.y });
      return false;
    });
    player.kills += before - state.enemies.length;
    this.upgradeWeapon(player);
  }

  /** Bow: a new arrow is a copy of the prototype arrow, so every shot starts with its own stats. */
  private shootArrow(player: Player): void {
    if (player.cooldown > 0 || player.ammo <= 0) return;
    player.ammo--;
    player.cooldown = SHOOT_COOLDOWN;

    const startX = player.x + Math.cos(player.aim) * (player.r + 4);
    const startY = player.y + Math.sin(player.aim) * (player.r + 4);
    const blocked = isWallAt(this.state.maze, startX, startY); // standing against a wall: shoot from the body instead
    this.arrows.push(ARROW_PROTOTYPE.clone().launch(player.id, blocked ? player.x : startX, blocked ? player.y : startY, player.aim));
  }

  private updateArrows(dt: number): void {
    const flying: Arrow[] = [];
    for (const arrow of this.arrows) this.flyArrow(arrow, dt, flying);
    this.arrows = flying;
  }

  /** Moves one arrow. Survivors (and bounce copies) are added to `flying`. */
  private flyArrow(arrow: Arrow, dt: number, flying: Arrow[]): void {
    const { maze, enemies, players } = this.state;
    const owner = players.find(p => p.id === arrow.ownerId)!; // arrows of a player who left are removed in removePlayer()
    const total = arrow.stats.speed * dt;
    const steps = Math.max(1, Math.ceil(total / ARROW_STEP));
    const step = total / steps;
    const copies: Arrow[] = [];

    for (let i = 0; i < steps; i++) {
      const nextX = arrow.x + Math.cos(arrow.angle) * step;
      const nextY = arrow.y + Math.sin(arrow.angle) * step;

      if (isWallAt(maze, nextX, nextY)) {
        if (arrow.bouncesLeft <= 0) { flying.push(...copies); return; } // used all its bounces: the arrow breaks on the wall
        const hitSide = isWallAt(maze, nextX, arrow.y); // the wall is to the left or right
        const hitTop = isWallAt(maze, arrow.x, nextY); // the wall is above or below
        if (hitSide && !hitTop) arrow.angle = Math.PI - arrow.angle;
        else if (hitTop && !hitSide) arrow.angle = -arrow.angle;
        else arrow.angle += Math.PI; // corner: bounce straight back
        arrow.bouncesLeft--;
        this.events.notify({ type: 'arrow-bounce', x: arrow.x, y: arrow.y });
        // Prototype: from floor 5 the arrow doubles on every bounce. The copy only differs in its flight angle.
        if (this.state.level >= SPLIT_FROM_LEVEL) copies.push(arrow.clone().turn(SPLIT_ANGLE));
        continue; // stay at the last free spot and fly in the new direction next step
      }

      arrow.x = nextX;
      arrow.y = nextY;
      const target = enemies.find(enemy => distance(arrow, enemy) < enemy.r + 4);
      if (target) {
        target.hp -= arrow.stats.damage;
        target.hit = 0.16;
        moveBody(target, Math.cos(arrow.angle) * 12, Math.sin(arrow.angle) * 12, maze);
        this.events.notify({ type: 'enemy-hit', x: target.x, y: target.y });
        this.creditKills(owner);
        flying.push(...copies); // copies made earlier in this tick keep flying
        return;
      }
    }
    flying.push(arrow, ...copies);
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
