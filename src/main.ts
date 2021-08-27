import { Plugin, MenuItem } from 'obsidian';
import IconsPickerModal from './iconsPickerModal';
import { addToDOMWithElement, removeFromDOM, waitForNode } from './util';

export default class IconFolderPlugin extends Plugin {
  private folderIconData: Record<string, string>;

  async onload() {
    console.log('loading plugin obsidian-icon-folder');

    await this.loadIconFolderData();

    Object.entries(this.folderIconData).forEach(([key, value]) => {
      waitForNode(`[data-path="${key}"]`).then((node) => {
        addToDOMWithElement(this, key, value, node);
      });
    });

    this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file) => {
        const addIconMenuItem = (item: MenuItem) => {
          item.setTitle('Change icon');
          item.setIcon('hashtag');
          item.onClick(() => {
            menu.hide();
            const modal = new IconsPickerModal(this.app, this, file.path);
            modal.open();
          });
        };

        const removeIconMenuItem = (item: MenuItem) => {
          item.setTitle('Remove icon');
          item.setIcon('trash');
          item.onClick(() => {
            menu.hide();
            this.removeFolderIcon(file.path);
            removeFromDOM(file.path);
          });
        };

        menu.addItem(addIconMenuItem);
        menu.addItem(removeIconMenuItem);
      }),
    );
  }

  onunload() {
    console.log('unloading plugin obsidian-icon-folder');
  }

  removeFolderIcon(path: string): void {
    delete this.folderIconData[path];
    this.saveIconFolderData();
  }

  addFolderIcon(path: string, iconId: string): void {
    if (this.folderIconData[path]) {
      removeFromDOM(path);
    }

    this.folderIconData[path] = iconId;
    this.saveIconFolderData();
  }

  async loadIconFolderData(): Promise<void> {
    this.folderIconData = Object.assign({}, {}, await this.loadData());
  }

  async saveIconFolderData(): Promise<void> {
    await this.saveData(this.folderIconData);
  }
}
