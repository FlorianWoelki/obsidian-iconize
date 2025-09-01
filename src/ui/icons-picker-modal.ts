import { App, FuzzyMatch, FuzzySuggestModal } from 'obsidian';
import IconizePlugin from '@app/main';
import emoji from '@app/emoji';
import { type Icon } from '@app/icon-pack-manager';
import dom from '@app/lib/util/dom';
import { saveIconToIconPack } from '@app/util';
import {
  getSvgFromLoadedIcon,
  nextIdentifier,
} from '@app/icon-pack-manager/util';

export default class IconsPickerModal extends FuzzySuggestModal<any> {
  private plugin: IconizePlugin;
  private path: string;

  private renderIndex = 0;

  private recentlyUsedItems: Set<string>;

  public onSelect: (iconName: string) => void | undefined;

  constructor(app: App, plugin: IconizePlugin, path: string) {
    super(app);
    this.plugin = plugin;
    this.path = path;
    this.limit = 150;

    const pluginRecentltyUsedItems = [
      ...plugin.getSettings().recentlyUsedIcons,
    ];
    this.recentlyUsedItems = new Set(
      pluginRecentltyUsedItems.reverse().filter((iconName) => {
        return (
          this.plugin.getIconPackManager().doesIconExists(iconName) ||
          emoji.isEmoji(iconName)
        );
      }),
    );

    this.resultContainerEl.classList.add('iconize-modal');
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
        if (emoji.isEmoji(iconName)) {
          iconKeys.push({
            name: emoji.shortNames[iconName],
            prefix: 'Emoji',
            displayName: iconName,
            iconPackName: null,
            filename: '',
            svgContent: '',
            svgElement: '',
            svgViewbox: '',
          });
          return;
        }

        const nextLetter = nextIdentifier(iconName);
        const iconPrefix = iconName.substring(0, nextLetter);
        const iconPackName = this.plugin
          .getIconPackManager()
          .getIconPackByName(iconPrefix)
          .getName();
        iconKeys.push({
          name: iconName.substring(nextLetter),
          prefix: iconPrefix,
          displayName: iconName,
          iconPackName: iconPackName,
          filename: '',
          svgContent: '',
          svgElement: '',
          svgViewbox: '',
        });
      });
    }

    for (const icon of this.plugin.getIconPackManager().allLoadedIconNames) {
      iconKeys.push(icon);
    }

    Object.entries(emoji.shortNames).forEach(([unicode, shortName]) => {
      iconKeys.push({
        name: shortName,
        prefix: 'Emoji',
        displayName: unicode,
        iconPackName: null,
        filename: '',
        svgContent: '',
        svgElement: '',
        svgViewbox: '',
      });
      iconKeys.push({
        name: unicode,
        prefix: 'Emoji',
        displayName: unicode,
        iconPackName: null,
        filename: '',
        svgContent: '',
        svgElement: '',
        svgViewbox: '',
      });
    });

    return iconKeys;
  }

  onChooseItem(item: Icon | string): void {
    const iconNameWithPrefix =
      typeof item === 'object' ? item.displayName : item;
    dom.createIconNode(this.plugin, this.path, iconNameWithPrefix);
    this.onSelect?.(iconNameWithPrefix);
    this.plugin.addFolderIcon(this.path, item);
    // Extracts the icon file to the icon pack.
    if (typeof item === 'object' && !emoji.isEmoji(iconNameWithPrefix)) {
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
        subheadline.classList.add('iconize-subheadline');
        subheadline.innerText = 'Recently used Icons:';
        this.resultContainerEl.prepend(subheadline);
      } else if (this.renderIndex === this.recentlyUsedItems.size - 1) {
        const subheadline = this.resultContainerEl.createDiv();
        subheadline.classList.add('iconize-subheadline');
        subheadline.innerText = 'All Icons:';
        this.resultContainerEl.append(subheadline);
      }
    }

    if (item.item.name !== 'default') {
      if (item.item.prefix === 'Emoji') {
  let displayName = emoji.parseEmoji(
    this.plugin.getSettings().emojiStyle,
    item.item.displayName,
  );

  // FIXED: Fall back to native emoji if twemoji fails (like for ♟)
  if (!displayName && this.plugin.getSettings().emojiStyle === 'twemoji') {
    displayName = item.item.displayName;
  }

  if (!displayName) {
    return;
  }

  el.innerHTML = `<div>${el.innerHTML}</div><div class="iconize-icon-preview">${displayName}</div>`;
} else {
        el.innerHTML = `<div>${
          el.innerHTML
        }</div><div class="iconize-icon-preview">${getSvgFromLoadedIcon(
          this.plugin,
          item.item.prefix,
          item.item.name,
        )}</div>`;
      }
    }

    this.renderIndex++;
  }
}
