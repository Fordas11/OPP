export type ScreenName = 'menu' | 'waiting' | 'playing' | 'pause' | 'over';

// 'playing' has no overlay: the arena is fully visible.
const overlays: Record<Exclude<ScreenName, 'playing'>, HTMLElement> = {
  menu: document.querySelector<HTMLElement>('#menuScreen')!,
  waiting: document.querySelector<HTMLElement>('#waitingScreen')!,
  pause: document.querySelector<HTMLElement>('#pauseScreen')!,
  over: document.querySelector<HTMLElement>('#gameOverScreen')!,
};

let current: ScreenName = 'menu';

export function currentScreen(): ScreenName {
  return current;
}

export function showScreen(name: ScreenName): void {
  current = name;
  for (const [key, element] of Object.entries(overlays)) {
    element.classList.toggle('hidden', key !== name);
  }
}

export function setText(selector: string, text: string): void {
  document.querySelector(selector)!.textContent = text;
}
