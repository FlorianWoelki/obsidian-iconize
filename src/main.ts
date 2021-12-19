import { Plugin, MenuItem } from 'obsidian';
import IconFolderSettingsTab from './iconFolderSettingsTab';
import IconsPickerModal, { Icon } from './iconsPickerModal';
import { DEFAULT_SETTINGS, IconFolderSettings } from './settings';
import { addIconsToDOM, addToDOM, removeFromDOM } from './util';

export interface FolderIconObject {
  iconName: string | null;
  inheritanceIcon: string;
}

export default class IconFolderPlugin extends Plugin {
  private data: Record<string, string | IconFolderSettings | FolderIconObject>;
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

        const node = document.querySelector(`[data-path="${file.path}"]`);
        const iconNode = node.querySelector('.obsidian-icon-folder-icon');

        if (iconNode) {
          menu.addItem(removeIconMenuItem);
        }

        const inheritIcon = (item: MenuItem) => {
          if (typeof this.data[file.path] === 'object') {
            item.setTitle('Remove inherit icon');
            item.onClick(() => {
              this.removeInheritanceForFolder(file.path);
              this.saveInheritanceForFolder(file.path, null);
            });
          } else {
            item.setTitle('Inherit icon');
            item.onClick(() => {
              const modal = new IconsPickerModal(this.app, this, file.path);
              modal.open();
              // manipulate `onChooseItem` method to get custom functioanlity for inheriting icons
              modal.onChooseItem = (icon: Icon) => {
                this.saveInheritanceForFolder(file.path, icon);
                this.addInheritanceForFolder(file.path);
              };
            });
          }
          item.setIcon('vertical-three-dots');
        };

        menu.addItem(inheritIcon);
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
    // transform data that are objects to single strings
    const data = Object.entries(this.data) as [string, string | FolderIconObject][];

    addIconsToDOM(this, data, this.registeredFileExplorers);
  }

  private saveInheritanceForFolder(folderPath: string, icon: Icon | null): void {
    const currentValue = this.data[folderPath];
    if (icon === null) {
      if (currentValue && typeof currentValue === 'object') {
        const folderObject = currentValue as FolderIconObject;

        if (folderObject.iconName) {
          this.data[folderPath] = folderObject.iconName;
        } else {
          delete this.data[folderPath];
        }
      }
    } else {
      if (currentValue) {
        // check if current value is already an icon name
        if (typeof currentValue === 'string') {
          this.data[folderPath] = {
            iconName: currentValue as string,
            inheritanceIcon: icon.name,
          };
        }
        // check if it has already a inheritance icon
        else if (folderPath !== 'settings') {
          this.data[folderPath] = {
            ...(currentValue as FolderIconObject),
            inheritanceIcon: icon.name,
          };
        }
      } else {
        this.data[folderPath] = {
          iconName: null,
          inheritanceIcon: icon.name,
        };
      }
    }

    this.saveIconFolderData();
  }

  private removeInheritanceForFolder(folderPath: string): void {
    const folder = this.data[folderPath];
    if (!folder || typeof folder !== 'object') {
      return;
    }

    const files = this.app.vault.getFiles().filter((f) => f.path.includes(folderPath));
    files.forEach((f) => {
      removeFromDOM(f.path);
    });
  }

  private addInheritanceForFolder(folderPath: string): void {
    const folder = this.data[folderPath];
    if (!folder || typeof folder !== 'object') {
      return;
    }

    const files = this.app.vault.getFiles().filter((f) => f.path.includes(folderPath));
    files.forEach((f) => {
      addToDOM(this, f.path, (folder as any).inheritanceIcon);
    });
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

    if (typeof this.data[path] === 'object') {
      const currentValue = this.data[path] as FolderIconObject;
      this.data[path] = {
        ...currentValue,
        iconName: null,
      };
    } else {
      delete this.data[path];
    }

    this.saveIconFolderData();
  }

  addFolderIcon(path: string, icon: Icon): void {
    this.data[path] = icon.name;
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

  getData(): Record<string, string | IconFolderSettings | FolderIconObject> {
    return this.data;
  }
}
