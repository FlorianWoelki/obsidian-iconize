import { App, Modal, ColorComponent, ButtonComponent, Notice } from 'obsidian';
import IconFolderPlugin from '@app/main';
import svg from '@app/lib/util/svg';
import dom from '@app/lib/util/dom';

export default class ChangeColorModal extends Modal {
  private plugin: IconFolderPlugin;
  private path: string;

  private usedColor?: string;

  constructor(app: App, plugin: IconFolderPlugin, path: string) {
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
    const colorContainer = this.contentEl.createDiv();
    colorContainer.style.display = 'flex';
    colorContainer.style.alignItems = 'center';
    colorContainer.style.justifyContent = 'space-between';
    const colorPicker = new ColorComponent(colorContainer)
      .setValue(this.usedColor ?? '#000000')
      .onChange((value) => {
        this.usedColor = value;
      });
    const defaultColorButton = new ButtonComponent(colorContainer);
    defaultColorButton.setTooltip('Set color to the default one');
    defaultColorButton.setButtonText('Reset');
    defaultColorButton.onClick(() => {
      colorPicker.setValue('#000000');
      this.usedColor = undefined;
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

  onOpen() {
    super.onOpen();
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
