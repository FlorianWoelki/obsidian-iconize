import { ButtonComponent } from 'obsidian';

export class ResetButtonComponent extends ButtonComponent {
  constructor(protected contentEl: HTMLElement) {
    super(contentEl);
    this.setTooltip('Restore default');
    this.setIcon('rotate-ccw');
    this.render();
  }

  private render(): void {
    this.buttonEl.classList.add('clickable-icon');
    this.buttonEl.classList.add('extra-setting-button');
  }
}
