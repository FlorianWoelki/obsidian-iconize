import { App, Modal, ColorComponent, ButtonComponent, Notice } from 'obsidian';
import IconizePlugin from '@app/main';
import svg from '@app/lib/util/svg';
import dom from '@app/lib/util/dom';

const PREDEFINED_COLORS = [
  '#272727',
  '#FF393C',
  '#FF8D28',
  '#FFCC02',
  '#35C759',
  '#03C3CF',
  '#0088FF',
  '#6254F5',
  '#CB30E0',
  '#FF2C55',
  '#AC7F5E',
  '#8E8E94',
];

export default class ChangeColorModal extends Modal {
  private plugin: IconizePlugin;
  private path: string;

  private usedColor?: string;
  private colorButtons: HTMLButtonElement[] = [];

  constructor(app: App, plugin: IconizePlugin, path: string) {
    super(app);
    this.plugin = plugin;
    this.path = path;

    this.usedColor = this.plugin.getIconColor(this.path);

    this.contentEl.style.display = 'block';
    this.modalEl.classList.add('iconize-custom-modal');
    this.titleEl.setText('Change color');

    const description = this.contentEl.createEl('p', {
      text: 'Select a color for this icon',
      cls: 'setting-item-description',
    });
    description.style.marginBottom = 'var(--size-2-2)';

    const predefinedColorsContainer = this.contentEl.createDiv();
    predefinedColorsContainer.style.display = 'flex';
    predefinedColorsContainer.style.flexWrap = 'wrap';
    predefinedColorsContainer.style.gap = 'var(--size-2-1)';
    predefinedColorsContainer.style.marginBottom = 'var(--size-2-2)';

    PREDEFINED_COLORS.forEach((color) => {
      const colorButton = predefinedColorsContainer.createEl('button');
      colorButton.type = 'button';
      colorButton.setAttr('aria-label', `Select ${color} color`);
      colorButton.setAttr('title', color);
      colorButton.style.width = '20px';
      colorButton.style.height = '20px';
      colorButton.style.borderRadius = '50%';
      colorButton.style.border = '1px solid var(--background-modifier-border)';
      colorButton.style.backgroundColor = color;
      colorButton.style.padding = '0';
      colorButton.style.cursor = 'pointer';

      colorButton.addEventListener('click', () => {
        colorPicker.setValue(color);
        this.usedColor = color;
        this.updateSelectedColor();
      });

      this.colorButtons.push(colorButton);
    });

    this.updateSelectedColor();

    const colorContainer = this.contentEl.createDiv();
    colorContainer.style.display = 'flex';
    colorContainer.style.alignItems = 'center';
    colorContainer.style.justifyContent = 'space-between';
    const colorPicker = new ColorComponent(colorContainer)
      .setValue(this.usedColor ?? '#000000')
      .onChange((value) => {
        this.usedColor = value;
        this.updateSelectedColor();
      });
    const defaultColorButton = new ButtonComponent(colorContainer);
    defaultColorButton.setTooltip('Set color to the default one');
    defaultColorButton.setButtonText('Reset');
    defaultColorButton.onClick(() => {
      colorPicker.setValue('#000000');
      this.usedColor = undefined;
      this.updateSelectedColor();
    });

    // Save button.
    const button = new ButtonComponent(this.contentEl);
    button.buttonEl.style.marginTop = 'var(--size-4-4)';
    button.buttonEl.style.float = 'right';
    button.setButtonText('Save Changes');
    button.onClick(async () => {
      new Notice('Color of icon changed.');

      if (this.usedColor) {
        this.plugin.addIconColor(this.path, this.usedColor);
      } else {
        this.plugin.removeIconColor(this.path);
      }

      // Refresh the DOM.
      const iconNode = dom.getIconNodeFromPath(this.path);
      iconNode.style.color = this.usedColor ?? null;
      const colorizedInnerHtml = svg.colorize(
        iconNode.innerHTML,
        this.usedColor,
      );
      iconNode.innerHTML = colorizedInnerHtml;

      this.close();
    });
  }

  private updateSelectedColor() {
    this.colorButtons.forEach((button, index) => {
      const color = PREDEFINED_COLORS[index];
      if (this.usedColor === color) {
        button.style.border = '2px solid var(--text-normal)';
      } else {
        button.style.border = '1px solid var(--background-modifier-border)';
      }
    });
  }

  onOpen() {
    super.onOpen();
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
