import { isDifficulty, type Difficulty } from '../../shared/core/constants.js';

export type Action = 'up' | 'down' | 'left' | 'right' | 'attack' | 'shoot';
export type BarStyleName = 'solid' | 'segmented';

const STORAGE_KEY = 'dungeon-crawler-settings';

export const DEFAULT_BINDINGS: Record<Action, string> = {
  up: 'KeyW',
  down: 'KeyS',
  left: 'KeyA',
  right: 'KeyD',
  attack: 'Mouse0',
  shoot: 'Mouse2',
};

export const settings: { bindings: Record<Action, string>; difficulty: Difficulty; barStyle: BarStyleName } = {
  bindings: { ...DEFAULT_BINDINGS },
  difficulty: 'standard',
  barStyle: 'solid',
};

export function isBarStyle(value: unknown): value is BarStyleName {
  return value === 'solid' || value === 'segmented';
}

export function loadSettings(): void {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    settings.bindings = { ...DEFAULT_BINDINGS, ...saved.bindings };
    if (isDifficulty(saved.difficulty)) settings.difficulty = saved.difficulty;
    if (isBarStyle(saved.barStyle)) settings.barStyle = saved.barStyle;
  } catch {
    // no saved settings, the defaults are used
  }
}

export function saveSettings(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // settings still work for this session
  }
}

export function displayBinding(binding: string): string {
  const names: Record<string, string> = {
    ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→',
    Space: 'Space', Mouse0: 'Left click', Mouse1: 'Middle click', Mouse2: 'Right click',
  };
  return names[binding] ?? binding.replace('Key', '').replace('Digit', '');
}
