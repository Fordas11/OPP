const MAX_LINES = 5;
const LINE_TIME = 6000; // ms a line stays on screen

/** Facade subsystem: the console input and its answers. ~ opens it, Enter sends, Esc or ~ closes. */
export class ConsolePanel {
  private readonly input = document.querySelector<HTMLInputElement>('#consoleInput')!;
  private readonly log = document.querySelector<HTMLElement>('#consoleLog')!;

  public constructor(onSubmit: (text: string) => void) {
    // The game must not see the keys typed here (WASD would move the knight).
    this.input.addEventListener('keydown', event => {
      event.stopPropagation();
      if (event.key === 'Enter') {
        const text = this.input.value.trim();
        if (text) {
          this.print(`> ${text}`);
          onSubmit(text);
        }
        this.close();
      } else if (event.key === 'Escape' || event.code === 'Backquote') {
        event.preventDefault();
        this.close();
      }
    });
    this.input.addEventListener('keyup', event => event.stopPropagation());
  }

  public isOpen(): boolean {
    return !this.input.classList.contains('hidden');
  }

  public open(): void {
    this.input.value = '';
    this.input.classList.remove('hidden');
    this.input.focus();
  }

  public close(): void {
    this.input.classList.add('hidden');
    this.input.blur();
  }

  /** Adds a line; it disappears after a few seconds. */
  public print(text: string): void {
    const line = document.createElement('div');
    line.textContent = text;
    this.log.append(line);
    while (this.log.children.length > MAX_LINES) this.log.firstElementChild!.remove();
    setTimeout(() => line.remove(), LINE_TIME);
  }

  public clear(): void {
    this.close();
    this.log.replaceChildren();
  }
}
