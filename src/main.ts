import { Plugin, MenuItem } from 'obsidian';
import IconFolderSettingsTab from './iconFolderSettingsTab';
import IconsPickerModal, { Icon } from './iconsPickerModal';
import { DEFAULT_SETTINGS, IconFolderSettings } from './settings';
import { addIconsToDOM, removeFromDOM } from './util';

export default class IconFolderPlugin extends Plugin {
  private data: Record<string, string | Object>;
  private registeredFileExplorers = new WeakMap();

  async onload() {
    console.log('loading obsidian-icon-folder');

    await this.loadIconFolderData();

    this.app.workspace.onLayoutReady(() => this.handleChangeLayout());
    this.registerEvent(this.app.workspace.on('layout-change', () => this.handleChangeLayout()));

    this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file) => {
        const addIconMenuItem = (item: MenuItem) => {
          item.setTitle('Change icon');
          item.setIcon('hashtag');
          item.onClick(() => {
            const modal = new IconsPickerModal(this.app, this, file.path);
            modal.open();
          });
        };

        const removeIconMenuItem = (item: MenuItem) => {
          item.setTitle('Remove icon');
          item.setIcon('trash');
          item.onClick(() => {
            this.removeFolderIcon(file.path);
            removeFromDOM(file.path);
          });
        };

        menu.addItem(addIconMenuItem);
        menu.addItem(removeIconMenuItem);
      }),
    );

    // deleting event
    this.registerEvent(
      this.app.vault.on('delete', (file) => {
        const path = file.path;
        this.removeFolderIcon(path);
      }),
    );

    // renaming event
    this.registerEvent(
      this.app.vault.on('rename', (file, oldPath) => {
        this.renameFolder(file.path, oldPath);
      }),
    );

    this.addSettingTab(new IconFolderSettingsTab(this.app, this));
  }

  private handleChangeLayout(): void {
    const data = Object.entries(this.data) as [string, string];
    addIconsToDOM(this, data, this.registeredFileExplorers);
  }

  onunload() {
    console.log('unloading obsidian-icon-folder');
  }

  renameFolder(newPath: string, oldPath: string): void {
    if (!this.data[oldPath] || newPath === oldPath) {
      return;
    }

    Object.defineProperty(this.data, newPath, Object.getOwnPropertyDescriptor(this.data, oldPath));
    delete this.data[oldPath];
    this.saveIconFolderData();
  }

  removeFolderIcon(path: string): void {
    if (!this.data[path]) {
      return;
    }

    delete this.data[path];
    this.saveIconFolderData();
  }

  addFolderIcon(path: string, icon: Icon): void {
    if (this.data[path]) {
      removeFromDOM(path);
    }

    this.data[path] = icon.prefix + icon.name;
    this.saveIconFolderData();
  }

  public getSettings(): IconFolderSettings {
    return this.data.settings as IconFolderSettings;
  }

  async loadIconFolderData(): Promise<void> {
    const data = await this.loadData();
    this.data = Object.assign({ settings: { ...DEFAULT_SETTINGS } }, {}, data);
  }

  async saveIconFolderData(): Promise<void> {
    await this.saveData(this.data);
  }
}
