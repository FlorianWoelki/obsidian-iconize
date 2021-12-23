import twemoji from 'twemoji';
import { App, FuzzyMatch, FuzzySuggestModal } from 'obsidian';
import IconFolderPlugin from './main';
import { addToDOM, getEnabledIcons, getIcon, isEmoji } from './util';

export interface Icon {
  name: string;
  prefix: string;
}

export default class IconsPickerModal extends FuzzySuggestModal<any> {
  private plugin: IconFolderPlugin;
  private path: string;

  constructor(app: App, plugin: IconFolderPlugin, path: string) {
    super(app);
    this.plugin = plugin;
    this.path = path;
  }

  onNoSuggestion(): void {
    super.onNoSuggestion();
    const inputVal = this.inputEl.value;
    if (isEmoji(inputVal)) {
      this.resultContainerEl.empty();

      const suggestionItem = this.resultContainerEl.createDiv();
      suggestionItem.className = 'suggestion-item';
      suggestionItem.textContent = 'Use twemoji Emoji';
      suggestionItem.innerHTML += `<div class="obsidian-icon-folder-icon-preview">${twemoji.parse(inputVal)}</div>`;
      suggestionItem.addEventListener('click', () => {
        const codepoint = twemoji.convert.toCodePoint(inputVal);
        this.onChooseItem(codepoint);
        this.close();
      });
      this.resultContainerEl.appendChild(suggestionItem);
    }
  }

  onOpen() {
    super.onOpen();
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }

  getItemText(item: Icon): string {
    return `${item.name.substring(2)} (${item.prefix})`;
  }

  getItems(): Icon[] {
    const iconKeys: Icon[] = [];
    for (const icon of getEnabledIcons(this.plugin)) {
      iconKeys.push({
        name: icon,
        prefix: icon.substring(0, 2),
      });
    }

    return iconKeys;
  }

  onChooseItem(item: Icon | string): void {
    if (typeof item === 'object') {
      addToDOM(this.plugin, this.path, item.name);
    } else {
      addToDOM(this.plugin, this.path, item);
    }
    this.plugin.addFolderIcon(this.path, item);
  }

  renderSuggestion(item: FuzzyMatch<Icon>, el: HTMLElement): void {
    super.renderSuggestion(item, el);

    if (item.item.name !== 'default') {
      el.innerHTML += `<div class="obsidian-icon-folder-icon-preview">${getIcon(item.item.name)}</div>`;
    }
  }
}
