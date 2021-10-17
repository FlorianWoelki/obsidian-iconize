import { App, FuzzyMatch, FuzzySuggestModal } from 'obsidian';
import IconFolderPlugin from './main';
import { addToDOM, getEnabledIcons, getIcon } from './util';

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

  onOpen() {
    super.onOpen();
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }

  getItemText(item: Icon): string {
    return item.name;
  }

  getItems(): Icon[] {
    const iconKeys: Icon[] = [];
    for (const icon of getEnabledIcons(this.plugin)) {
      iconKeys.push({
        name: icon,
        prefix: 'Ri',
      });
    }

    return iconKeys;
  }

  onChooseItem(item: Icon): void {
    addToDOM(this.path, item.name);
    this.plugin.addFolderIcon(this.path, item);
  }

  renderSuggestion(item: FuzzyMatch<Icon>, el: HTMLElement): void {
    super.renderSuggestion(item, el);

    if (item.item.name !== 'default') {
      el.innerHTML += `<div class="obsidian-icon-folder-icon-preview">${getIcon(item.item.name)}</div>`;
    }
  }
}
