import { ValueComponent } from 'obsidian';

export class ColorPickerComponent extends ValueComponent<string> {
  private value: string = '#000000';
  private containerEl: HTMLElement;
  private inputEl: HTMLInputElement;

  constructor(containerEl: HTMLElement) {
    super();
    this.containerEl = containerEl;

    this.inputEl = containerEl.createEl('input');
    this.inputEl.type = 'color';
    this.inputEl.ariaLabel = 'Click to change the color';
    this.containerEl.classList.add('obsidian-icon-folder-setting');
  }

  onChange(callback: (value: string) => void): this {
    this.inputEl.addEventListener('input', () => {
      this.setValue(this.inputEl.value);
      callback(this.getValue());
    });
    return this;
  }

  getValue(): string {
    return this.value;
  }

  setValue(value: string): this {
    this.value = value;
    this.inputEl.value = value;
    return this;
  }

  build(): this {
    this.containerEl.appendChild(this.inputEl);
    return this;
  }
}
