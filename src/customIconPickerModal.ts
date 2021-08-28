import * as remixicons from 'react-icons/ri/index';
import { App, Modal } from 'obsidian';
import { renderToString } from 'react-dom/server';
import { Icon } from './iconsPickerModal';
import IconFolderPlugin from './main';
import { addToDOM } from './util';

export default class CustomIconPickerModal extends Modal {
  private plugin: IconFolderPlugin;
  private path: string;

  constructor(app: App, plugin: IconFolderPlugin, path: string) {
    super(app);
    this.plugin = plugin;
    this.path = path;

    this.modalEl.classList.add('prompt');

    const titleNode = this.modalEl.createEl('input');
    titleNode.classList.add('prompt-input');
    titleNode.type = 'text';
    titleNode.placeholder = 'Select an icon...';
    this.modalEl.insertBefore(titleNode, this.modalEl.firstChild);

    let timeout: NodeJS.Timeout = null;
    titleNode.addEventListener('keyup', (e) => {
      if (timeout) clearTimeout(timeout);

      const inputValue = (e.target as HTMLInputElement).value.toLowerCase();
      if (inputValue.trim().length === 0) {
        clearTimeout(timeout);
        for (let i = 0; i < this.contentEl.children.length; i += 1) {
          (this.contentEl.children[i] as HTMLElement).style.display = 'block';
        }
      } else {
        const filteredItems = Array.from(this.contentEl.children).filter((child) =>
          child.textContent.toLowerCase().includes(inputValue),
        );
        timeout = setTimeout(() => {
          for (let i = 0; i < this.contentEl.children.length; i += 1) {
            (this.contentEl.children[i] as HTMLElement).style.display = 'none';
          }
          for (let i = 0; i < filteredItems.length; i += 1) {
            (filteredItems[i] as HTMLElement).style.display = 'block';
          }
        }, 100);
      }
    });

    this.modalEl.querySelector('.modal-close-button').remove();
  }

  getItems(): Icon[] {
    const iconKeys: Icon[] = [];
    for (const icon in remixicons) {
      if (icon !== 'default') {
        iconKeys.push({
          id: icon,
          name: icon.substring(2),
        });
      }
    }

    return iconKeys;
  }

  onOpen() {
    super.onOpen();
    this.renderItems(this.getItems());
  }

  renderItems(items: Icon[], chunk = 20): void {
    const loop = (i: number) => {
      if (i >= items.length) return;
      for (let j = i; j < i + chunk; j += 1) {
        if (!items[j]) continue;
        const html = renderToString(
          (remixicons as any)[items[j].id]({
            size: '16px',
          }),
        );
        const node = document.createElement('div');
        node.classList.add('suggestion-item');
        node.innerHTML = `<div class="obsidian-icon-folder-icon-preview">${html}</div>${items[j].name}`;
        this.contentEl.appendChild(node);
      }

      // register events for added children
      for (let j = i; j < i + chunk; j += 1) {
        const child = this.contentEl.children[j];
        if (!items[j] || !child) continue;
        child.addEventListener('mouseenter', () => {
          child.classList.add('is-selected'); // obsidian class
        });
        child.addEventListener('mouseleave', () => {
          child.classList.remove('is-selected'); // obsidian class
        });
        child.addEventListener('click', () => this.onItemClick(items[j]));
      }

      setTimeout(loop.bind(null, i + chunk));
    };
    loop(0);
  }

  onItemClick(item: Icon): void {
    addToDOM(this.plugin, this.path, item.id);
    this.plugin.addFolderIcon(this.path, item.id);
    this.close();
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
