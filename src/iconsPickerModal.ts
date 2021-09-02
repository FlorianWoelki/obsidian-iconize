import { App, FuzzyMatch, FuzzySuggestModal } from 'obsidian';
import IconFolderPlugin from './main';
import { addToDOM, getAllIcons, getIcon } from './util';

export interface Icon {
  id: string;
  name: string;
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
    for (const icon in getAllIcons()) {
      iconKeys.push({
        id: icon,
        name: icon,
      });
    }

    return iconKeys;
  }

  onChooseItem(item: Icon): void {
    addToDOM(this.plugin, this.path, item.id);
    this.plugin.addFolderIcon(this.path, item.id);
  }

  renderSuggestion(item: FuzzyMatch<Icon>, el: HTMLElement): void {
    super.renderSuggestion(item, el);

    if (item.item.id !== 'default') {
      el.innerHTML += `<div class="obsidian-icon-folder-icon-preview">${getIcon(item.item.id)}</div>`;
    }
  }
}
