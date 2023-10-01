import twemoji from 'twemoji';
import { App, FuzzyMatch, FuzzySuggestModal } from 'obsidian';
import IconFolderPlugin from './main';
import emoji from './emoji';
import {
  doesIconExists,
  getAllLoadedIconNames,
  getIconPackNameByPrefix,
  getSvgFromLoadedIcon,
  nextIdentifier,
} from './iconPackManager';
import dom from './lib/util/dom';
import { saveIconToIconPack } from '@app/util';

export interface Icon {
  name: string;
  iconPackName: string | null; // Can be `null` if the icon is an emoji.
  displayName: string;
  prefix: string;
}

export default class IconsPickerModal extends FuzzySuggestModal<any> {
  private plugin: IconFolderPlugin;
  private path: string;

  private renderIndex = 0;

  private recentlyUsedItems: Set<string>;

  public onSelect: (iconName: string) => void | undefined;

  constructor(app: App, plugin: IconFolderPlugin, path: string) {
    super(app);
    this.plugin = plugin;
    this.path = path;
    this.limit = 150;

    const pluginRecentltyUsedItems = [
      ...plugin.getSettings().recentlyUsedIcons,
    ];
    this.recentlyUsedItems = new Set(
      pluginRecentltyUsedItems.reverse().filter((iconName) => {
        return doesIconExists(iconName) || emoji.isEmoji(iconName);
      }),
    );

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
        if (this.plugin.isSomeEmojiStyleActive() && emoji.isEmoji(iconName)) {
          iconKeys.push({
            name: emoji.shortNames[iconName],
            prefix: 'Emoji',
            displayName: iconName,
            iconPackName: null,
          });
          return;
        }

        const nextLetter = nextIdentifier(iconName);
        const iconPrefix = iconName.substring(0, nextLetter);
        const iconPackName = getIconPackNameByPrefix(iconPrefix);
        iconKeys.push({
          name: iconName.substring(nextLetter),
          prefix: iconPrefix,
          displayName: iconName,
          iconPackName: iconPackName,
        });
      });
    }

    for (const icon of getAllLoadedIconNames()) {
      iconKeys.push({
        name: icon.name,
        prefix: icon.prefix,
        displayName: icon.prefix + icon.name,
        iconPackName: icon.iconPackName,
      });
    }

    if (this.plugin.isSomeEmojiStyleActive()) {
      Object.entries(emoji.shortNames).forEach(([unicode, shortName]) => {
        iconKeys.push({
          name: shortName,
          prefix: 'Emoji',
          displayName: unicode,
          iconPackName: null,
        });
        iconKeys.push({
          name: unicode,
          prefix: 'Emoji',
          displayName: unicode,
          iconPackName: null,
        });
      });
    }

    return iconKeys;
  }

  onChooseItem(item: Icon | string): void {
    const iconNameWithPrefix =
      typeof item === 'object' ? item.displayName : item;
    dom.createIconNode(this.plugin, this.path, iconNameWithPrefix);
    this.onSelect?.(iconNameWithPrefix);
    this.plugin.addFolderIcon(this.path, item);
    // Extracts the icon file to the icon pack.
    if (typeof item === 'object') {
      saveIconToIconPack(this.plugin, iconNameWithPrefix);
    }
    this.plugin.notifyPlugins();
  }

  renderSuggestion(item: FuzzyMatch<Icon>, el: HTMLElement): void {
    super.renderSuggestion(item, el);

    // if (getAllIconPacks().length === 0) {
    //   this.resultContainerEl.style.display = 'block';
    //   this.resultContainerEl.innerHTML = '<div class="suggestion-empty">You need to create an icon pack.</div>';
    //   return;
    // }

    // Render subheadlines for modal.
    if (this.recentlyUsedItems.size !== 0 && this.inputEl.value.length === 0) {
      if (this.renderIndex === 0) {
        const subheadline = this.resultContainerEl.createDiv();
        subheadline.classList.add('obsidian-icon-folder-subheadline');
        subheadline.innerText = 'Recently used Icons:';
        this.resultContainerEl.prepend(subheadline);
      } else if (this.renderIndex === this.recentlyUsedItems.size - 1) {
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
        el.innerHTML = `<div>${
          el.innerHTML
        }</div><div class="obsidian-icon-folder-icon-preview">${getSvgFromLoadedIcon(
          item.item.prefix,
          item.item.name,
        )}</div>`;
      }
    }

    this.renderIndex++;
  }
}
