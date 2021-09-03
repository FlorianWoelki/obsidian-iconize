import { Plugin, MenuItem } from 'obsidian';
import IconsPickerModal, { Icon } from './iconsPickerModal';
import { addIconsToDOM, removeFromDOM } from './util';

export default class IconFolderPlugin extends Plugin {
  private folderIconData: Record<string, string>;
  private registeredFileExplorers = new WeakMap();

  async onload() {
    console.log('loading obsidian-icon-folder');

    await this.loadIconFolderData();

    const data = Object.entries(this.folderIconData) as [string, string];
    this.app.workspace.onLayoutReady(() => {
      addIconsToDOM(this, data, this.registeredFileExplorers);
    });

    this.registerEvent(
      this.app.workspace.on('layout-change', () => {
        addIconsToDOM(this, data, this.registeredFileExplorers);
      }),
    );

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
  }

  onunload() {
    console.log('unloading obsidian-icon-folder');
  }

  renameFolder(newPath: string, oldPath: string): void {
    if (!this.folderIconData[oldPath] || newPath === oldPath) {
      return;
    }

    Object.defineProperty(this.folderIconData, newPath, Object.getOwnPropertyDescriptor(this.folderIconData, oldPath));
    delete this.folderIconData[oldPath];
    this.saveIconFolderData();
  }

  removeFolderIcon(path: string): void {
    if (!this.folderIconData[path]) {
      return;
    }

    delete this.folderIconData[path];
    this.saveIconFolderData();
  }

  addFolderIcon(path: string, icon: Icon): void {
    if (this.folderIconData[path]) {
      removeFromDOM(path);
    }

    this.folderIconData[path] = icon.prefix + icon.name;
    this.saveIconFolderData();
  }

  async loadIconFolderData(): Promise<void> {
    this.folderIconData = Object.assign({}, {}, await this.loadData());
  }

  async saveIconFolderData(): Promise<void> {
    await this.saveData(this.folderIconData);
  }
}
