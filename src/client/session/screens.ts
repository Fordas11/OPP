export type ScreenName = 'menu' | 'waiting' | 'playing' | 'pause' | 'over';

/** Facade subsystem: overlays and their texts. */
export class ScreenManager {
  // 'playing' has no overlay.
  private readonly overlays: Record<Exclude<ScreenName, 'playing'>, HTMLElement> = {
    menu: document.querySelector<HTMLElement>('#menuScreen')!,
    waiting: document.querySelector<HTMLElement>('#waitingScreen')!,
    pause: document.querySelector<HTMLElement>('#pauseScreen')!,
    over: document.querySelector<HTMLElement>('#gameOverScreen')!,
  };
  private current: ScreenName = 'menu';

  public currentScreen(): ScreenName {
    return this.current;
  }

  public showScreen(name: ScreenName): void {
    this.current = name;
    for (const [key, element] of Object.entries(this.overlays)) {
      element.classList.toggle('hidden', key !== name);
    }
  }

  public setText(selector: string, text: string): void {
    document.querySelector(selector)!.textContent = text;
  }
}
