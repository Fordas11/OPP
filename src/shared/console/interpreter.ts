import type { EnemyKind } from '../enemies/enemyFactory.js';

/**
 * Interpreter: the in-game console understands a tiny language.
 *
 *   line    := command { ";" command }
 *   command := "repeat" NUMBER command | simple
 *   simple  := "help" | "heal" | "speed" NUMBER | "god" SWITCH | "freeze" SWITCH
 *            | "spawn" KIND [NUMBER] | "give" ("arrows" | "shield") [NUMBER]
 *
 * The parser turns the text into a tree of Expression objects, then interpret() runs the tree.
 * Simple commands are terminal expressions; `;` and `repeat` are non-terminal (they contain other expressions).
 */
export interface Expression {
  interpret(context: ConsoleContext): void;
}

/** What console commands can do to the game. */
export interface ConsoleContext {
  say(text: string): void;
  heal(): void;
  setSpeed(speed: number): void;
  setGodMode(on: boolean): void;
  setEnemiesFrozen(on: boolean): void;
  spawn(kind: EnemyKind, count: number): void;
  giveArrows(amount: number): void;
  giveShield(amount: number): void;
}

/** A mistake in what the player typed. */
export class ConsoleError extends Error {}

const ENEMY_KINDS: EnemyKind[] = ['skeleton', 'runner', 'brute'];

// ---------- Terminal expressions ----------

class HelpExpression implements Expression {
  public interpret(context: ConsoleContext): void {
    context.say('heal | speed N | god on/off | freeze on/off | spawn KIND [N] | give arrows/shield [N] | repeat N cmd | a ; b');
  }
}

class HealExpression implements Expression {
  public interpret(context: ConsoleContext): void {
    context.heal();
    context.say('Healed.');
  }
}

class SpeedExpression implements Expression {
  public constructor(private readonly speed: number) {}
  public interpret(context: ConsoleContext): void {
    context.setSpeed(this.speed);
    context.say(`Speed ${this.speed}.`);
  }
}

class GodModeExpression implements Expression {
  public constructor(private readonly on: boolean) {}
  public interpret(context: ConsoleContext): void {
    context.setGodMode(this.on);
    context.say(`God mode ${this.on ? 'on' : 'off'}.`);
  }
}

class FreezeExpression implements Expression {
  public constructor(private readonly on: boolean) {}
  public interpret(context: ConsoleContext): void {
    context.setEnemiesFrozen(this.on);
    context.say(`Enemies ${this.on ? 'frozen' : 'moving'}.`);
  }
}

class SpawnExpression implements Expression {
  public constructor(private readonly kind: EnemyKind, private readonly count: number) {}
  public interpret(context: ConsoleContext): void {
    context.spawn(this.kind, this.count);
    context.say(`Spawned ${this.count} ${this.kind}.`);
  }
}

class GiveArrowsExpression implements Expression {
  public constructor(private readonly amount: number) {}
  public interpret(context: ConsoleContext): void {
    context.giveArrows(this.amount);
    context.say(`+${this.amount} arrows.`);
  }
}

class GiveShieldExpression implements Expression {
  public constructor(private readonly amount: number) {}
  public interpret(context: ConsoleContext): void {
    context.giveShield(this.amount);
    context.say(`+${this.amount} shield.`);
  }
}

// ---------- Non-terminal expressions ----------

/** `a ; b ; c` */
class SequenceExpression implements Expression {
  public constructor(private readonly parts: Expression[]) {}
  public interpret(context: ConsoleContext): void {
    for (const part of this.parts) part.interpret(context);
  }
}

/** `repeat 3 spawn runner` */
class RepeatExpression implements Expression {
  public constructor(private readonly times: number, private readonly inner: Expression) {}
  public interpret(context: ConsoleContext): void {
    for (let i = 0; i < this.times; i++) this.inner.interpret(context);
  }
}

// ---------- Parser ----------

/** Builds the expression tree. Throws ConsoleError with a readable message. */
export function parseCommand(text: string): Expression {
  const commands = text.split(';').map(part => part.trim()).filter(part => part !== '');
  if (commands.length === 0) throw new ConsoleError('Type a command. Try: help');
  const parsed = commands.map(command => parseOne(command.toLowerCase().split(/\s+/)));
  return parsed.length === 1 ? parsed[0] : new SequenceExpression(parsed);
}

function parseOne(words: string[]): Expression {
  const [name, ...args] = words;
  switch (name) {
    case 'help': return noArguments(args, new HelpExpression());
    case 'heal': return noArguments(args, new HealExpression());
    case 'speed': return new SpeedExpression(readNumber(args, 0, 100, 500, 'speed'));
    case 'god': return new GodModeExpression(readSwitch(args[0]));
    case 'freeze': return new FreezeExpression(readSwitch(args[0]));
    case 'spawn': return new SpawnExpression(readKind(args[0]), readNumber(args, 1, 1, 5, 'count', 1));
    case 'give': return parseGive(args);
    case 'repeat': {
      if (args.length < 2) throw new ConsoleError('Use: repeat N command');
      return new RepeatExpression(readNumber(args, 0, 1, 5, 'repeat'), parseOne(args.slice(1)));
    }
    default: throw new ConsoleError(`Unknown command "${name}". Try: help`);
  }
}

function parseGive(args: string[]): Expression {
  if (args[0] === 'arrows') return new GiveArrowsExpression(readNumber(args, 1, 1, 20, 'amount', 10));
  if (args[0] === 'shield') return new GiveShieldExpression(readNumber(args, 1, 1, 2, 'amount', 1));
  throw new ConsoleError('Use: give arrows [N] or give shield [N]');
}

function noArguments(args: string[], expression: Expression): Expression {
  if (args.length > 0) throw new ConsoleError(`Unexpected "${args[0]}".`);
  return expression;
}

/** The number at `args[index]`, or `fallback` if it is missing and a fallback is given. */
function readNumber(args: string[], index: number, min: number, max: number, label: string, fallback?: number): number {
  const word = args[index];
  if (word === undefined && fallback !== undefined) return fallback;
  const value = Number(word);
  if (word === undefined || !Number.isInteger(value) || value < min || value > max) {
    throw new ConsoleError(`${label} must be a whole number from ${min} to ${max}.`);
  }
  return value;
}

function readSwitch(word: string | undefined): boolean {
  if (word === 'on') return true;
  if (word === 'off') return false;
  throw new ConsoleError('Use "on" or "off".');
}

function readKind(word: string | undefined): EnemyKind {
  const kind = ENEMY_KINDS.find(known => known === word);
  if (!kind) throw new ConsoleError(`Enemy kind must be ${ENEMY_KINDS.join(', ')}.`);
  return kind;
}
