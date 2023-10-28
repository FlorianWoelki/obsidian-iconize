import { App, FuzzyMatch, FuzzySuggestModal, Notice } from 'obsidian';
import {
  registerIconPack,
  createIconPackPrefix,
  createZipFile,
  getAllIconPacks,
} from '@app/icon-pack-manager';
import iconPacks, { IconPack } from '@app/icon-packs';
import IconFolderPlugin from '@app/main';
import { downloadZipFile } from '@app/zip-util';

export default class IconPackBrowserModal extends FuzzySuggestModal<IconPack> {
  private plugin: IconFolderPlugin;

  constructor(app: App, plugin: IconFolderPlugin) {
    super(app);
    this.plugin = plugin;

    this.resultContainerEl.classList.add('iconize-browse-modal');
    this.inputEl.placeholder = 'Select to download icon pack';
  }

  // eslint-disable-next-line
  onAddedIconPack(): void {}

  onOpen(): void {
    super.onOpen();
  }

  onClose(): void {
    this.contentEl.empty();
  }

  getItemText(item: IconPack): string {
    const prefix = createIconPackPrefix(item.name);
    return `${item.displayName} (${prefix})`;
  }

  getItems(): IconPack[] {
    const predefinedIconPacks = Object.values(iconPacks);
    const allIconPacks = getAllIconPacks();

    return predefinedIconPacks.filter(
      (iconPack) =>
        allIconPacks.find((ip) => iconPack.name === ip.name) === undefined,
    );
  }

  async onChooseItem(
    item: IconPack,
    _event: MouseEvent | KeyboardEvent,
  ): Promise<void> {
    new Notice(`Adding ${item.displayName}...`);

    const arrayBuffer = await downloadZipFile(item.downloadLink);
    await createZipFile(this.plugin, `${item.name}.zip`, arrayBuffer);
    await registerIconPack(item.name, arrayBuffer);

    new Notice(`...${item.displayName} added`);
    this.onAddedIconPack();
  }

  renderSuggestion(item: FuzzyMatch<IconPack>, el: HTMLElement): void {
    super.renderSuggestion(item, el);

    el.innerHTML = `<div>${el.innerHTML}</div>`;
  }
}
