import { App, FuzzyMatch, FuzzySuggestModal } from 'obsidian';
import { getAllIconPacks } from './iconPackManager';
import iconPacks, { IconPack } from './iconPacks';
import IconFolderPlugin from './main';

export default class IconPackBrowserModal extends FuzzySuggestModal<IconPack> {
  private plugin: IconFolderPlugin;

  constructor(app: App, plugin: IconFolderPlugin) {
    super(app);
    this.plugin = plugin;

    this.resultContainerEl.classList.add('obsidian-icon-folder-browse-modal');
    this.inputEl.placeholder = 'Select to download icon pack';
  }

  onOpen(): void {
    super.onOpen();
  }

  onClose(): void {
    this.contentEl.empty();
  }

  getItemText(item: IconPack): string {
    return item.displayName;
  }

  getItems(): IconPack[] {
    const predefinedIconPacks = Object.values(iconPacks);
    const allIconPacks = getAllIconPacks();

    return predefinedIconPacks.filter((iconPack) => allIconPacks.find((ip) => iconPack.name === ip.name) === undefined);
  }

  onChooseItem(item: IconPack, evt: MouseEvent | KeyboardEvent): void {}

  renderSuggestion(item: FuzzyMatch<IconPack>, el: HTMLElement): void {
    super.renderSuggestion(item, el);

    el.innerHTML = `<div>${el.innerHTML}</div>`;
  }
}
