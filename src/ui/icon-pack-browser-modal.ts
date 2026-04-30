import { App, FuzzyMatch, FuzzySuggestModal, Notice } from 'obsidian';
import { T } from '../locales/translations';
import predefinedIconPacks, { PredefinedIconPack } from '@app/icon-packs';
import IconizePlugin from '@app/main';
import { downloadZipFile } from '@app/zip-util';
import { IconPack } from '@app/icon-pack-manager/icon-pack';

export default class IconPackBrowserModal extends FuzzySuggestModal<PredefinedIconPack> {
  private plugin: IconizePlugin;

  constructor(app: App, plugin: IconizePlugin) {
    super(app);
    this.plugin = plugin;

    this.resultContainerEl.classList.add('iconize-browse-modal');
    this.inputEl.placeholder = T('Select to download icon pack');
  }

  // eslint-disable-next-line
  onAddedIconPack(): void {}

  onOpen(): void {
    super.onOpen();
  }

  onClose(): void {
    this.contentEl.empty();
  }

  getItemText(item: PredefinedIconPack): string {
    // TODO: refactor this
    const tempIconPack = new IconPack(this.plugin, item.name, false);
    return `${item.displayName} (${tempIconPack.getPrefix()})`;
  }

  getItems(): PredefinedIconPack[] {
    const iconPacks = Object.values(predefinedIconPacks);
    const allIconPacks = this.plugin.getIconPackManager().getIconPacks();

    return iconPacks.filter(
      (iconPack) =>
        allIconPacks.find((ip) => iconPack.name === ip.getName()) === undefined,
    );
  }

  async onChooseItem(
    item: PredefinedIconPack,
    _event: MouseEvent | KeyboardEvent,
  ): Promise<void> {
    new Notice(`Adding ${item.displayName}...`);

    const arrayBuffer = await downloadZipFile(item.downloadLink);
    await this.plugin
      .getIconPackManager()
      .getFileManager()
      .createZipFile(
        this.plugin.getIconPackManager().getPath(),
        `${item.name}.zip`,
        arrayBuffer,
      );
    await this.plugin
      .getIconPackManager()
      .registerIconPack(item.name, arrayBuffer);

    new Notice(`...${item.displayName} added`);
    this.onAddedIconPack();
  }

  renderSuggestion(
    item: FuzzyMatch<PredefinedIconPack>,
    el: HTMLElement,
  ): void {
    super.renderSuggestion(item, el);

    el.innerHTML = `<div>${el.innerHTML}</div>`;
  }
}
