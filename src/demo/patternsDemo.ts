import type { WebSocket } from 'ws';
import { WebSocketAdapter } from '../server/connection.js';
import { BlessedBlade, LongBlade, SharpBlade, SWORD_PROTOTYPE, type Weapon } from '../shared/weapon.js';

// Run with: npm run demo

/** JavaScript has no memory addresses, so every object gets a number the first time we print it. */
const ids = new WeakMap<object, number>();
let lastId = 0;
function id(value: object): string {
  if (!ids.has(value)) ids.set(value, ++lastId);
  return `#${ids.get(value)}`;
}

function adapterDemo(): void {
  console.log('--- Adapter ---');
  // A fake socket that only prints the text it would send over the network.
  const fakeSocket = { OPEN: 1, readyState: 1, send: (text: string) => console.log('  socket got text:', text) };
  const connection = new WebSocketAdapter(fakeSocket as unknown as WebSocket);
  connection.send({ type: 'game-started', you: 0 });
}

function prototypeDemo(): void {
  console.log('--- Prototype ---');
  const original = SWORD_PROTOTYPE;
  const shallow = original.shallowClone();
  const deep = original.clone();

  console.log(`  original  sword ${id(original)}  stats ${id(original.stats)}`);
  console.log(`  shallow   sword ${id(shallow)}  stats ${id(shallow.stats)}   <- same stats as original`);
  console.log(`  deep      sword ${id(deep)}  stats ${id(deep.stats)}   <- own stats`);

  deep.stats.damage = 50;
  console.log(`  after deep.stats.damage = 50    -> original damage: ${original.damage()} (unchanged)`);
  shallow.stats.damage = 99;
  console.log(`  after shallow.stats.damage = 99 -> original damage: ${original.damage()} (changed by mistake)`);
  shallow.stats.damage = 1; // put it back so the next demo starts clean
}

function decoratorDemo(): void {
  console.log('--- Decorator ---');
  let weapon: Weapon = SWORD_PROTOTYPE.clone();
  show(weapon);
  weapon = new LongBlade(weapon);
  show(weapon);
  weapon = new SharpBlade(weapon);
  show(weapon);
  weapon = new BlessedBlade(weapon);
  show(weapon);
}

function show(weapon: Weapon): void {
  console.log(`  ${weapon.name()}: damage ${weapon.damage()}, reach ${weapon.reach()}`);
}

function main(): void {
  adapterDemo();
  prototypeDemo();
  decoratorDemo();
}

main();
