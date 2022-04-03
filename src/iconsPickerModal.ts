import twemoji from 'twemoji';
import { App, FuzzyMatch, FuzzySuggestModal } from 'obsidian';
import IconFolderPlugin from './main';
import { addToDOM, getEnabledIcons, getIcon, isEmoji } from './util';
import { getAllIconPacks, nextIdentifier } from './iconPackManager';

type EnterScope = (() => void) | ((e: KeyboardEvent) => void);

export interface Icon {
  name: string;
  displayName: string;
  prefix: string;
}

export default class IconsPickerModal extends FuzzySuggestModal<any> {
  private plugin: IconFolderPlugin;
  private path: string;

  private oldEnterFunc: (e: KeyboardEvent) => void;

  private renderIndex: number = 0;
  private lastRenderedRecentlyIcon: HTMLElement;

  private recentlyUsedItems: string[];

  constructor(app: App, plugin: IconFolderPlugin, path: string) {
    super(app);
    this.plugin = plugin;
    this.path = path;
    this.limit = 150;
    this.recentlyUsedItems = plugin.getSettings().recentlyUsedIcons.reverse();

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
    return `${item.name} (${item.prefix})`;
  }

  getItems(): Icon[] {
    const iconKeys: Icon[] = [];

    if (this.inputEl.value.length === 0) {
      this.renderIndex = 0;
      this.recentlyUsedItems.forEach((iconName) => {
        const nextLetter = nextIdentifier(iconName);
        iconKeys.push({
          name: iconName.substring(nextLetter),
          prefix: iconName.substring(0, nextLetter),
          displayName: iconName,
        });
      });
    }

    for (const icon of getEnabledIcons(this.plugin)) {
      iconKeys.push({
        name: icon.name,
        prefix: icon.prefix,
        displayName: icon.prefix + icon.name,
      });
    }

    return iconKeys;
  }

  onChooseItem(item: Icon | string): void {
    if (typeof item === 'object') {
      addToDOM(this.plugin, this.path, item.displayName);
    } else {
      addToDOM(this.plugin, this.path, item);
    }
    this.plugin.addFolderIcon(this.path, item);
  }

  renderSuggestion(item: FuzzyMatch<Icon>, el: HTMLElement): void {
    super.renderSuggestion(item, el);

    if (getAllIconPacks().length === 0) {
      this.resultContainerEl.style.display = 'block';
      this.resultContainerEl.innerHTML = '<div class="suggestion-empty">You need to create an icon pack.</div>';
      return;
    }

    // Render subheadlines for modal.
    if (this.recentlyUsedItems.length !== 0 && this.inputEl.value.length === 0) {
      if (this.renderIndex === 0) {
        const subheadline = this.resultContainerEl.createDiv();
        subheadline.classList.add('obsidian-icon-folder-subheadline');
        subheadline.innerText = 'Recently used Icons:';
        this.resultContainerEl.prepend(subheadline);
      } else if (this.renderIndex === this.recentlyUsedItems.length) {
        const subheadline = this.containerEl.createDiv();
        subheadline.classList.add('obsidian-icon-folder-subheadline');
        subheadline.innerText = 'All Icons:';
        subheadline.insertAfter(this.lastRenderedRecentlyIcon);
      }
    }

    if (this.getEnterScope() !== this.oldEnterFunc) {
      this.setEnterScope(this.oldEnterFunc);
    }

    if (item.item.name !== 'default') {
      const possibleEmoji = el.innerHTML.trim().replace(/\(|\)/gi, '');
      if (isEmoji(possibleEmoji)) {
        el.innerHTML = `<div>Twemoji</div><div class="obsidian-icon-folder-icon-preview">${twemoji.parse(
          possibleEmoji,
        )}</div>`;
      } else {
        el.innerHTML = `<div>${el.innerHTML}</div><div class="obsidian-icon-folder-icon-preview">${getIcon(
          item.item.name,
        )}</div>`;
      }
    }

    this.lastRenderedRecentlyIcon = el;
    this.renderIndex++;
  }

  private setEnterScope(func: EnterScope): void {
    (this.scope as any).keys.find((e: any) => e.key === 'Enter').func = func;
  }

  private getEnterScope(): EnterScope {
    return (this.scope as any).keys.find((e: any) => e.key === 'Enter').func;
  }
}
