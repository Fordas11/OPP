import { EnemyFactory, type EnemyKind } from '../shared/enemies/enemyFactory.js';
import type { Enemy } from '../shared/core/types.js';
import { EnemyTypeFactory } from '../shared/enemies/enemyFlyweight.js';

const COUNT = 200_000;
const KINDS: EnemyKind[] = ['skeleton', 'runner', 'brute'];

function usedMemoryMb(): number {
  globalThis.gc?.();
  return process.memoryUsage().heapUsed / 1024 / 1024;
}

const factory = new EnemyFactory();
const memoryBefore = usedMemoryMb();
const start = performance.now();

const enemies: Enemy[] = [];
for (let i = 0; i < COUNT; i++) enemies.push(factory.create(KINDS[i % KINDS.length], { x: 100, y: 100 }, 1 + (i % 5)));

const time = performance.now() - start;
const memoryAfter = usedMemoryMb();

console.log(`Priešų sukurta: ${enemies.length}`);
console.log(`Sukūrimo laikas: ${time.toFixed(2)} ms`);
console.log(`Bendrų EnemyType objektų: ${EnemyTypeFactory.count()}`);
console.log(`Užimta atmintis: ${(memoryAfter - memoryBefore).toFixed(2)} MB`);
