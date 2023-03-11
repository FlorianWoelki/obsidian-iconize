import twemoji from 'twemoji';
import { App, FuzzyMatch, FuzzySuggestModal } from 'obsidian';
import IconFolderPlugin from './main';
import emoji from './emoji';
import { addToDOM, isEmoji } from './util';
import { doesIconExists, getAllLoadedIconNames, getSvgFromLoadedIcon, nextIdentifier } from './iconPackManager';

export interface Icon {
  name: string;
  displayName: string;
  prefix: string;
}

export default class IconsPickerModal extends FuzzySuggestModal<any> {
  private plugin: IconFolderPlugin;
  private path: string;

  private renderIndex: number = 0;

  private recentlyUsedItems: string[];

  public onSelect: (iconName: string) => void | undefined;

  constructor(app: App, plugin: IconFolderPlugin, path: string) {
    super(app);
    this.plugin = plugin;
    this.path = path;
    this.limit = 150;

    const pluginRecentltyUsedItems = [...plugin.getSettings().recentlyUsedIcons];
    this.recentlyUsedItems = pluginRecentltyUsedItems.reverse().filter((iconName) => {
      return doesIconExists(iconName) || isEmoji(iconName);
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
        if (this.plugin.isSomeEmojiStyleActive() && isEmoji(iconName)) {
          iconKeys.push({
            name: emoji[iconName],
            prefix: 'Emoji',
            displayName: iconName,
          });
          return;
        }

        const nextLetter = nextIdentifier(iconName);
        iconKeys.push({
          name: iconName.substring(nextLetter),
          prefix: iconName.substring(0, nextLetter),
          displayName: iconName,
        });
      });
    }

    for (const icon of getAllLoadedIconNames()) {
      iconKeys.push({
        name: icon.name,
        prefix: icon.prefix,
        displayName: icon.prefix + icon.name,
      });
    }

    if (this.plugin.isSomeEmojiStyleActive()) {
      Object.entries(emoji).forEach(([unicode, shortName]) => {
        iconKeys.push({
          name: shortName,
          prefix: 'Emoji',
          displayName: unicode,
        });
        iconKeys.push({
          name: unicode,
          prefix: 'Emoji',
          displayName: unicode,
        });
      });
    }

    return iconKeys;
  }

  onChooseItem(item: Icon | string): void {
    const iconName = typeof item === 'object' ? item.displayName : item;
    addToDOM(this.plugin, this.path, iconName);
    this.onSelect?.(iconName);
    this.plugin.addFolderIcon(this.path, item);
  }

  renderSuggestion(item: FuzzyMatch<Icon>, el: HTMLElement): void {
    super.renderSuggestion(item, el);

    // if (getAllIconPacks().length === 0) {
    //   this.resultContainerEl.style.display = 'block';
    //   this.resultContainerEl.innerHTML = '<div class="suggestion-empty">You need to create an icon pack.</div>';
    //   return;
    // }

    // Render subheadlines for modal.
    if (this.recentlyUsedItems.length !== 0 && this.inputEl.value.length === 0) {
      if (this.renderIndex === 0) {
        const subheadline = this.resultContainerEl.createDiv();
        subheadline.classList.add('obsidian-icon-folder-subheadline');
        subheadline.innerText = 'Recently used Icons:';
        this.resultContainerEl.prepend(subheadline);
      } else if (this.renderIndex === this.recentlyUsedItems.length - 1) {
        const subheadline = this.resultContainerEl.createDiv();
        subheadline.classList.add('obsidian-icon-folder-subheadline');
        subheadline.innerText = 'All Icons:';
        this.resultContainerEl.append(subheadline);
      }
    }

    if (item.item.name !== 'default') {
      if (item.item.prefix === 'Emoji') {
        let displayName = '';
        switch (this.plugin.getSettings().emojiStyle) {
          case 'twemoji':
            displayName = twemoji.parse(item.item.displayName, {
              base: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/',
            });
            break;
          case 'native':
            displayName = item.item.displayName;
            break;
          default:
            break;
        }
        el.innerHTML = `<div>${el.innerHTML}</div><div class="obsidian-icon-folder-icon-preview">${displayName}</div>`;
      } else {
        el.innerHTML = `<div>${el.innerHTML}</div><div class="obsidian-icon-folder-icon-preview">${getSvgFromLoadedIcon(
          item.item.prefix,
          item.item.name,
        )}</div>`;
      }
    }

    this.renderIndex++;
  }
}
