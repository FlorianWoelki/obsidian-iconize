import { App, FuzzyMatch, FuzzySuggestModal, Notice } from 'obsidian';
import {
  addIconToIconPack,
  createFile,
  createIconPackDirectory,
  createIconPackPrefix,
  getAllIconPacks,
} from './iconPackManager';
import iconPacks, { IconPack } from './iconPacks';
import IconFolderPlugin from './main';
import { downloadZipFile, getFileFromJSZipFile, readZipFile } from './zipUtil';

export default class IconPackBrowserModal extends FuzzySuggestModal<IconPack> {
  private plugin: IconFolderPlugin;

  constructor(app: App, plugin: IconFolderPlugin) {
    super(app);
    this.plugin = plugin;

    this.resultContainerEl.classList.add('obsidian-icon-folder-browse-modal');
    this.inputEl.placeholder = 'Select to download icon pack';
  }

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

    return predefinedIconPacks.filter((iconPack) => allIconPacks.find((ip) => iconPack.name === ip.name) === undefined);
  }

  async onChooseItem(item: IconPack, _event: MouseEvent | KeyboardEvent): Promise<void> {
    new Notice(`Adding ${item.displayName}...`);
    createIconPackDirectory(this.plugin, item.name);
    downloadZipFile(item.downloadLink).then((zipBlob) => {
      readZipFile(zipBlob, item.path).then(async (files) => {
        for (let i = 0; i < files.length; i++) {
          const file = await getFileFromJSZipFile(files[i]);
          const reader = new FileReader();
          reader.readAsText(file, 'UTF-8');
          reader.onload = async (readerEvent) => {
            const content = readerEvent.target.result as string;
            addIconToIconPack(item.name, file.name, content, async () => {
              await createFile(this.plugin, item.name, file.name, content);
            });
          };
        }

        new Notice(`...${item.displayName} added`);
        this.onAddedIconPack();
      });
    });
  }

  renderSuggestion(item: FuzzyMatch<IconPack>, el: HTMLElement): void {
    super.renderSuggestion(item, el);

    el.innerHTML = `<div>${el.innerHTML}</div>`;
  }
}
