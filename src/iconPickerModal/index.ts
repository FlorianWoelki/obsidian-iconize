import * as remixicons from 'react-icons/ri/index';
import { App, Modal } from 'obsidian';
import { renderToString } from 'react-dom/server';
import { Icon } from '../iconsPickerModal';
import IconFolderPlugin from '../main';
import { addToDOM } from '../util';
import { createInstructions } from './instructions';

export default class IconPickerModal extends Modal {
  private plugin: IconFolderPlugin;
  private path: string;

  private items: Icon[] = [];

  private isKeyPressed = false;
  private currentFocusedItemIndex = -1;
  private inputValue = '';

  private titleNode!: HTMLInputElement;

  constructor(app: App, plugin: IconFolderPlugin, path: string) {
    super(app);
    this.plugin = plugin;
    this.path = path;

    this.modalEl.classList.add('prompt');
    this.addTitleNode();

    this.handleKeyboardInput(this.titleNode);

    this.modalEl.querySelector('.modal-close-button').remove();

    this.modalEl.appendChild(
      createInstructions(this.modalEl, [
        {
          key: '↑↓',
          description: 'to navigate',
        },
        {
          key: '↵',
          description: 'to use',
        },
        {
          key: 'esc',
          description: 'to dismiss',
        },
      ]),
    );
  }

  addTitleNode(): void {
    this.titleNode = this.modalEl.createEl('input');
    this.titleNode.classList.add('prompt-input');
    this.titleNode.type = 'text';
    this.titleNode.placeholder = 'Select an icon...';
    this.modalEl.insertBefore(this.titleNode, this.modalEl.firstChild);
  }

  handleUpAndDownNavigation(e: KeyboardEvent): void {
    if (this.isKeyPressed) return;

    if (e.key !== 'Enter' && e.key !== 'ArrowDown' && e.key !== 'ArrowUp') {
      return;
    }

    this.isKeyPressed = true;

    // filter children for all visible children
    const filteredChildren = Array.from(this.contentEl.children).filter(
      (child: HTMLElement) => child.style.display !== 'none',
    );

    if (e.key === 'Enter' && this.currentFocusedItemIndex >= 0) {
      const selectedNode = filteredChildren[this.currentFocusedItemIndex];
      const selectedItem = this.items.filter((item) => item.name === selectedNode.textContent);
      if (selectedItem.length === 1) {
        this.onItemClick(selectedItem[0]);
      }
    } else if (e.key === 'ArrowDown') {
      if (this.currentFocusedItemIndex >= filteredChildren.length - 1) return;

      if (this.currentFocusedItemIndex < 0) {
        this.titleNode.blur();
      } else {
        filteredChildren[this.currentFocusedItemIndex].classList.remove('is-selected');
      }

      this.currentFocusedItemIndex += 1;
      filteredChildren[this.currentFocusedItemIndex].classList.add('is-selected');
    } else if (e.key === 'ArrowUp') {
      if (this.currentFocusedItemIndex < 0) return;

      filteredChildren[this.currentFocusedItemIndex].classList.remove('is-selected');
      this.currentFocusedItemIndex -= 1;

      if (this.currentFocusedItemIndex < 0) {
        this.titleNode.focus();
        return;
      }

      filteredChildren[this.currentFocusedItemIndex].classList.add('is-selected');
    }
  }

  handleKeyboardInput(titleNode: HTMLElement): void {
    let timeout: NodeJS.Timeout = null;
    titleNode.addEventListener('keyup', (e) => {
      if (timeout) clearTimeout(timeout);

      this.inputValue = (e.target as HTMLInputElement).value.toLowerCase();
      if (this.inputValue.trim().length === 0) {
        clearTimeout(timeout);
        for (let i = 0; i < this.contentEl.children.length; i += 1) {
          (this.contentEl.children[i] as HTMLElement).style.display = 'block';
        }
      } else {
        const filteredItems = Array.from(this.contentEl.children).filter((child) =>
          child.textContent.toLowerCase().includes(this.inputValue),
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
    this.items = this.getItems();
    this.renderItems(this.items);

    document.addEventListener('keydown', (e) => this.handleUpAndDownNavigation(e));
    document.addEventListener('keyup', () => this.handleKeyup());
  }

  handleKeyup(): void {
    this.isKeyPressed = false;
  }

  renderItems(items: Icon[], chunk = 20): void {
    const renderChildElements = (i: number) => {
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

        // check for input value (issue if not there: will still append visible elements to the list while filtering)
        if (this.inputValue.trim().length > 0 && !items[j].name.toLowerCase().includes(this.inputValue)) {
          node.style.display = 'none';
        }
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

      setTimeout(renderChildElements.bind(null, i + chunk));
    };
    renderChildElements(0);
  }

  onItemClick(item: Icon): void {
    addToDOM(this.plugin, this.path, item.id);
    this.plugin.addFolderIcon(this.path, item.id);
    this.close();
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();

    document.removeEventListener('keydown', this.handleUpAndDownNavigation);
    document.removeEventListener('keyup', this.handleKeyup);
  }
}
