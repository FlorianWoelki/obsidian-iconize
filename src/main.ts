import { Plugin, MenuItem, TFile } from 'obsidian';
import { ExplorerView } from './@types/obsidian';
import { createDefaultDirectory, initIconPacks, listPath, loadIcon, loadUsedIcons, setPath } from './iconPackManager';
import IconFolderSettingsTab from './iconFolderSettingsTab';
import IconsPickerModal, { Icon } from './iconsPickerModal';
import { DEFAULT_SETTINGS, IconFolderSettings } from './settings';
import {
  insertIconToNode,
  addIconsToDOM,
  addInheritanceForFolder,
  addInheritanceIconToFile,
  removeFromDOM,
  removeInheritanceForFolder,
  isEmoji,
} from './util';
import { migrateIcons } from './migration';

export interface FolderIconObject {
  iconName: string | null;
  inheritanceIcon: string;
}

export default class IconFolderPlugin extends Plugin {
  private data: Record<string, boolean | string | IconFolderSettings | FolderIconObject>;
  private registeredFileExplorers = new WeakSet<ExplorerView>();

  async onload() {
    console.log('loading obsidian-icon-folder');

    await createDefaultDirectory(this);
    await this.loadIconFolderData();
    await this.checkRecentlyUsedIcons();

    setPath(this.getSettings().iconPacksPath);

    if (!this.getSettings().migrated) {
      console.log('migrating icons...');
      this.data = migrateIcons(this);
      this.getSettings().migrated = true;
      await this.saveIconFolderData();
      console.log('...icons migrated');
    }

    const entries = Object.entries(this.data).map(([key, value]: [string, string | FolderIconObject]) => {
      if (key !== 'settings' && key !== 'migrated' && key !== 'iconPacksPath') {
        if (typeof value === 'string') {
          if (!isEmoji(value)) {
            return value;
          }
        }

        if (typeof value === 'object') {
          if (value.iconName !== null && !isEmoji(value.iconName)) {
            return value.iconName;
          }
          if (value.inheritanceIcon !== null && !isEmoji(value.inheritanceIcon)) {
            return value.inheritanceIcon;
          }
        }
      }
    });
    await loadUsedIcons(this, entries);

    initIconPacks(this);

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
              removeInheritanceForFolder(this, file.path);
              this.saveInheritanceData(file.path, null);
            });
          } else {
            item.setTitle('Inherit icon');
            item.onClick(() => {
              const modal = new IconsPickerModal(this.app, this, file.path);
              modal.open();
              // manipulate `onChooseItem` method to get custom functioanlity for inheriting icons
              modal.onChooseItem = (icon: Icon | string) => {
                this.saveInheritanceData(file.path, icon);
                addInheritanceForFolder(this, file.path);
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

  private getSearchLeave(): ExplorerView {
    return this.app.workspace.getLeavesOfType('search')[0].view;
  }

  private addIconsToSearch(): void {
    console.log(this.app.workspace.getLeavesOfType('backlink'));
    const searchLeaveDom = this.getSearchLeave().dom;
    searchLeaveDom.children.forEach((child) => {
      const file = child.file as TFile;
      const collapseEl = child.collapseEl as HTMLElement;

      const existingIcon = child.containerEl.querySelector('.obsidian-icon-folder-icon');
      if (existingIcon) {
        existingIcon.remove();
      }

      const iconName = this.data[file.path] as string | undefined;
      if (iconName) {
        const iconNode = child.containerEl.createDiv();
        iconNode.classList.add('obsidian-icon-folder-icon');

        insertIconToNode(this, this.data[file.path] as string, iconNode);

        iconNode.insertAfter(collapseEl);
      }
    });
  }

  private handleChangeLayout(): void {
    // transform data that are objects to single strings
    const data = Object.entries(this.data) as [string, string | FolderIconObject][];

    addIconsToDOM(this, data, this.registeredFileExplorers, () => {
      const searchLeaveDom = this.getSearchLeave().dom;
      searchLeaveDom.changed = () => this.addIconsToSearch();

      // register create event for checking inheritance functionality
      this.registerEvent(
        this.app.vault.on('create', (file) => {
          const inheritanceFolders = Object.entries(this.data).filter(
            ([k, v]) => k !== 'settings' && typeof v === 'object',
          );

          if (file.parent.path === '/') return;

          inheritanceFolders.forEach(([path, obj]: [string, FolderIconObject]) => {
            if (file.parent.path.includes(path)) {
              addInheritanceIconToFile(this, this.registeredFileExplorers, file.path, obj.inheritanceIcon);
            }
          });
        }),
      );
    });
  }

  private saveInheritanceData(folderPath: string, icon: Icon | string | null): void {
    const currentValue = this.data[folderPath];
    // if icon is null, it will remove the inheritance icon from the data
    if (icon === null && currentValue && typeof currentValue === 'object') {
      const folderObject = currentValue as FolderIconObject;

      if (folderObject.iconName) {
        this.data[folderPath] = folderObject.iconName;
      } else {
        delete this.data[folderPath];
      }
    }
    // icon is not null, so it will add inheritance data
    else {
      // check if data already exists
      if (currentValue) {
        // check if current value is already an icon name
        if (typeof currentValue === 'string') {
          this.data[folderPath] = {
            iconName: currentValue as string,
            inheritanceIcon: typeof icon === 'object' ? icon.displayName : icon,
          };
        }
        // check if it has already a inheritance icon
        else if (folderPath !== 'settings') {
          this.data[folderPath] = {
            ...(currentValue as FolderIconObject),
            inheritanceIcon: typeof icon === 'object' ? icon.displayName : icon,
          };
        }
      } else {
        this.data[folderPath] = {
          iconName: null,
          inheritanceIcon: typeof icon === 'object' ? icon.displayName : icon,
        };
      }
    }

    this.saveIconFolderData();
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

    this.addIconsToSearch();
    this.saveIconFolderData();
  }

  addFolderIcon(path: string, icon: Icon | string): void {
    const iconName = typeof icon === 'object' ? icon.displayName : icon;
    this.data[path] = iconName;
    if (!this.getSettings().recentlyUsedIcons.includes(iconName)) {
      if (this.getSettings().recentlyUsedIcons.length >= this.getSettings().recentlyUsedIconsSize) {
        this.getSettings().recentlyUsedIcons.pop();
      }

      this.getSettings().recentlyUsedIcons.unshift(iconName);
      this.checkRecentlyUsedIcons();
    }

    this.addIconsToSearch();
    this.saveIconFolderData();
  }

  public getSettings(): IconFolderSettings {
    return this.data.settings as IconFolderSettings;
  }

  async loadIconFolderData(): Promise<void> {
    const data = await this.loadData();
    if (data) {
      Object.entries(DEFAULT_SETTINGS).forEach(([k, v]) => {
        if (!data.settings[k]) {
          data.settings[k] = v;
        }
      });
    }
    this.data = Object.assign({ settings: { ...DEFAULT_SETTINGS } }, {}, data);
  }

  async saveIconFolderData(): Promise<void> {
    await this.saveData(this.data);
  }

  async checkRecentlyUsedIcons(): Promise<void> {
    if (this.getSettings().recentlyUsedIcons.length > this.getSettings().recentlyUsedIconsSize) {
      this.getSettings().recentlyUsedIcons = this.getSettings().recentlyUsedIcons.slice(
        0,
        this.getSettings().recentlyUsedIconsSize,
      );
      await this.saveIconFolderData();
    }
  }

  getData(): Record<string, boolean | string | IconFolderSettings | FolderIconObject> {
    return this.data;
  }
}
