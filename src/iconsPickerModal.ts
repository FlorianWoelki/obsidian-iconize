import twemoji from 'twemoji';
import { App, FuzzyMatch, FuzzySuggestModal } from 'obsidian';
import IconFolderPlugin from './main';
import emoji from './emoji';
import { addToDOM, getEnabledIcons, isEmoji } from './util';
import { doesIconExists, getAllIconPacks, getSvgFromLoadedIcon, nextIdentifier } from './iconPackManager';

type EnterScope = (() => void) | ((e: KeyboardEvent) => void);

export interface Icon {
  name: string;
  displayName: string;
  prefix: string;
}

export default class IconsPickerModal extends FuzzySuggestModal<any> {
  private plugin: IconFolderPlugin;
  private path: string;

  private renderIndex: number = 0;
  private lastRenderedRecentlyIcon: HTMLElement;

  private recentlyUsedItems: string[];

  constructor(app: App, plugin: IconFolderPlugin, path: string) {
    super(app);
    this.plugin = plugin;
    this.path = path;
    this.limit = 150;

    const pluginRecentltyUsedItems = [...plugin.getSettings().recentlyUsedIcons];
    this.recentlyUsedItems = pluginRecentltyUsedItems.reverse().filter((iconName) => {
      return doesIconExists(iconName);
    });

    this.resultContainerEl.classList.add('obsidian-icon-folder-modal');
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

    Object.entries(emoji).forEach(([unicode, shortName]) => {
      iconKeys.push({
        name: shortName,
        prefix: 'Twemoji',
        displayName: unicode,
      });
      iconKeys.push({
        name: unicode,
        prefix: 'Twemoji',
        displayName: unicode,
      });
    });

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

    if (item.item.name !== 'default') {
      if (item.item.prefix === 'Twemoji') {
        el.innerHTML = `<div>${el.innerHTML}</div><div class="obsidian-icon-folder-icon-preview">${twemoji.parse(
          item.item.displayName,
        )}</div>`;
      } else {
        el.innerHTML = `<div>${el.innerHTML}</div><div class="obsidian-icon-folder-icon-preview">${getSvgFromLoadedIcon(
          item.item.prefix,
          item.item.name,
        )}</div>`;
      }
    }

    this.lastRenderedRecentlyIcon = el;
    this.renderIndex++;
  }
}
