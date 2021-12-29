import twemoji from 'twemoji';
import { App, FuzzyMatch, FuzzySuggestModal } from 'obsidian';
import IconFolderPlugin from './main';
import { addToDOM, getEnabledIcons, getIcon, isEmoji } from './util';

type EnterScope = (() => void) | ((e: KeyboardEvent) => void);

export interface Icon {
  name: string;
  prefix: string;
}

export default class IconsPickerModal extends FuzzySuggestModal<any> {
  private plugin: IconFolderPlugin;
  private path: string;

  private oldEnterFunc: (e: KeyboardEvent) => void;

  constructor(app: App, plugin: IconFolderPlugin, path: string) {
    super(app);
    this.plugin = plugin;
    this.path = path;
    this.limit = 150;

    this.resultContainerEl.classList.add('obsidian-icon-folder-modal');

    this.oldEnterFunc = (this.scope as any).keys.find((e: any) => e.key === 'Enter').func;
  }

  onNoSuggestion(): void {
    super.onNoSuggestion();
    const inputVal = this.inputEl.value;
    if (isEmoji(inputVal)) {
      this.resultContainerEl.empty();

      const suggestionItem = this.resultContainerEl.createDiv();
      suggestionItem.className = 'suggestion-item suggestion-item__center is-selected';
      suggestionItem.textContent = 'Use twemoji Emoji';
      suggestionItem.innerHTML += `<div class="obsidian-icon-folder-icon-preview">${twemoji.parse(inputVal)}</div>`;

      this.setEnterScope(() => {
        this.selectTwemoji(inputVal);
      });

      suggestionItem.addEventListener('click', () => {
        this.selectTwemoji(inputVal);
      });
      this.resultContainerEl.appendChild(suggestionItem);
    }
  }

  private selectTwemoji(inputVal: string): void {
    this.onChooseItem(inputVal);
    this.close();
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

    if (this.getEnterScope() !== this.oldEnterFunc) {
      this.setEnterScope(this.oldEnterFunc);
    }

    if (item.item.name !== 'default') {
      el.innerHTML = `<div>${el.innerHTML}</div><div class="obsidian-icon-folder-icon-preview">${getIcon(
        item.item.name,
      )}</div>`;
    }
  }

  private setEnterScope(func: EnterScope): void {
    (this.scope as any).keys.find((e: any) => e.key === 'Enter').func = func;
  }

  private getEnterScope(): EnterScope {
    return (this.scope as any).keys.find((e: any) => e.key === 'Enter').func;
  }
}
