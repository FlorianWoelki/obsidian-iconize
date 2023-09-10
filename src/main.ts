import { Plugin, MenuItem, TFile, WorkspaceLeaf, requireApiVersion, Notice } from 'obsidian';
import { ExplorerLeaf, ExplorerView } from './@types/obsidian';
import { createDefaultDirectory, initIconPacks, loadUsedIcons, setPath } from './iconPackManager';
import IconsPickerModal, { Icon } from './iconsPickerModal';
import { DEFAULT_SETTINGS, ExtraMarginSettings, IconFolderSettings } from './settings/data';
import { migrateIcons } from './migration';
import IconFolderSettingsUI from './settings/ui';
import MetaData from './MetaData';
import StarredInternalPlugin from './internal-plugins/starred';
import InternalPluginInjector from './@types/internalPluginInjector';
import iconTabs from './lib/iconTabs';
import inheritance from './lib/inheritance';
import dom from './lib/util/dom';
import customRule from './lib/customRule';
import icon from './lib/icon';
import BookmarkInternalPlugin from './internal-plugins/bookmark';
import { removeIconFromIconPack, saveIconToIconPack } from '@app/util';

export interface FolderIconObject {
  iconName: string | null;
  inheritanceIcon: string;
}

export default class IconFolderPlugin extends Plugin {
  private data: Record<string, boolean | string | IconFolderSettings | FolderIconObject>;
  private registeredFileExplorers = new Set<ExplorerView>();

  private modifiedInternalPlugins: InternalPluginInjector[] = [];

  private async migrate(): Promise<void> {
    if (!this.getSettings().migrated) {
      console.log('migrating icons...');
      this.data = migrateIcons(this);
      this.getSettings().migrated++;
      console.log('...icons migrated');
    }

    // @ts-ignore
    if (this.getSettings().migrated === true) {
      this.getSettings().migrated = 1;
    }

    // Migration for new syncing mechanism.
    if (this.getSettings().migrated === 1) {
      new Notice(
        'Please delete your old icon packs and redownload your icon packs to use the new syncing mechanism.',
        20000,
      );
      this.getSettings().migrated++;
    }

    const extraPadding = (this.getSettings() as any).extraPadding as ExtraMarginSettings;
    if (extraPadding) {
      if (extraPadding.top !== 2 || extraPadding.bottom !== 2 || extraPadding.left !== 2 || extraPadding.right !== 2) {
        this.getSettings().extraMargin = extraPadding;
        delete (this.getSettings() as any)['extraPadding'];
      }
    }

    await this.saveIconFolderData();
  }

  async onload() {
    MetaData.pluginName = this.manifest.id;
    console.log(`loading ${MetaData.pluginName}`);

    // Registers all modified internal plugins.
    // Only adds star plugin for obsidian under v0.12.6.
    if (!requireApiVersion('0.12.6')) {
      this.modifiedInternalPlugins.push(new StarredInternalPlugin(this));
    } else if (requireApiVersion('1.2.0')) {
      this.modifiedInternalPlugins.push(new BookmarkInternalPlugin(this));
    }

    await this.loadIconFolderData();
    setPath(this.getSettings().iconPacksPath);

    await createDefaultDirectory(this);
    await this.checkRecentlyUsedIcons();

    await this.migrate();

    const usedIconNames = icon.getAllWithPath(this).map((value) => value.icon);
    await loadUsedIcons(this, usedIconNames);

    initIconPacks(this);

    this.app.workspace.onLayoutReady(() => this.handleChangeLayout());
    this.registerEvent(this.app.workspace.on('layout-change', () => this.handleChangeLayout()));

    this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file: TFile) => {
        const addIconMenuItem = (item: MenuItem) => {
          item.setTitle('Change icon');
          item.setIcon('hashtag');
          item.onClick(() => {
            const modal = new IconsPickerModal(this.app, this, file.path);
            modal.open();

            // Update icon in tab when setting is enabled.
            if (this.getSettings().iconInTabsEnabled) {
              modal.onSelect = (iconName: string): void => {
                iconTabs.update(this, file, iconName);
              };
            }
          });
        };

        const removeIconMenuItem = (item: MenuItem) => {
          item.setTitle('Remove icon');
          item.setIcon('trash');
          item.onClick(() => {
            this.removeFolderIcon(file.path);
            dom.removeIconInPath(file.path);
            this.notifyPlugins();

            // Remove icon in tab when setting is enabled.
            if (this.getSettings().iconInTabsEnabled) {
              iconTabs.remove(file, { replaceWithDefaultIcon: true });
            }

            // Check for possible inheritance and add the icon if an inheritance exists.
            if (inheritance.doesExistInPath(this, file.path)) {
              const folderPath = inheritance.getFolderPathByFilePath(this, file.path);
              const folderInheritance = inheritance.getByPath(this, file.path);
              const iconName = folderInheritance.inheritanceIcon;
              inheritance.add(this, folderPath, iconName, {
                file,
                onAdd: (file) => {
                  if (this.getSettings().iconInTabsEnabled) {
                    iconTabs.add(this, file as TFile, { iconName });
                  }
                },
              });
            }

            customRule.addAll(this);
          });
        };

        menu.addItem(addIconMenuItem);

        const filePathData = this.getData()[file.path];
        const inheritanceFolderHasIcon =
          typeof filePathData === 'object' && (filePathData as FolderIconObject).iconName !== null;
        // Only add remove icon menu item when the file path exists in the data.
        // We do not want to show this menu item for e.g. inheritance or custom rules.
        if (filePathData && (typeof filePathData === 'string' || inheritanceFolderHasIcon)) {
          menu.addItem(removeIconMenuItem);
        }

        const inheritIcon = (item: MenuItem) => {
          const iconData = this.data[file.path] as FolderIconObject | string;
          if (typeof iconData === 'object') {
            item.setTitle('Remove inherit icon');
            item.onClick(() => {
              inheritance.remove(this, file.path, {
                onRemove: (file) => {
                  // Removes the icons from the file tabs inside of the inheritance.
                  if (this.getSettings().iconInTabsEnabled) {
                    iconTabs.remove(file as TFile, { replaceWithDefaultIcon: true });
                  }
                },
              });
              this.saveInheritanceData(file.path, null);
              removeIconFromIconPack(this, iconData.inheritanceIcon);
            });
          } else {
            item.setTitle('Inherit icon');
            item.onClick(() => {
              const modal = new IconsPickerModal(this.app, this, file.path);
              modal.open();
              // manipulate `onChooseItem` method to get custom functionality for inheriting icons
              modal.onChooseItem = (icon: Icon | string) => {
                this.saveInheritanceData(file.path, icon);
                const iconName = typeof icon === 'string' ? icon : icon.displayName;
                saveIconToIconPack(this, iconName);
                inheritance.add(this, file.path, iconName, {
                  onAdd: (file) => {
                    if (this.getSettings().iconInTabsEnabled) {
                      iconTabs.add(this, file as TFile, { iconName });
                    }
                  },
                });
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

    this.addSettingTab(new IconFolderSettingsUI(this.app, this));
  }

  public isSomeEmojiStyleActive(): boolean {
    return this.getSettings().emojiStyle !== 'none';
  }

  public notifyPlugins(): void {
    this.modifiedInternalPlugins.forEach((internalPlugin) => {
      if (internalPlugin.enabled) {
        internalPlugin.onMount();
      }
    });
  }

  private handleChangeLayout(): void {
    // Transform data that are objects to single strings.
    const data = Object.entries(this.data) as [string, string | FolderIconObject][];

    this.modifiedInternalPlugins.forEach((internalPlugin) => {
      if (internalPlugin.enabled) {
        internalPlugin.onMount();
        internalPlugin.register();
      }
    });

    icon.addAll(this, data, this.registeredFileExplorers, () => {
      //const searchLeaveDom = this.getSearchLeave().dom;
      //searchLeaveDom.changed = () => this.addIconsToSearch();

      // Register rename event for adding icons with custom rules to the DOM and updating
      // inheritance when file was moved to another directory.
      this.registerEvent(
        this.app.vault.on('rename', (file, oldPath) => {
          customRule.getSortedRules(this).forEach(async (rule) => {
            if (customRule.doesExistInPath(rule, oldPath)) {
              dom.removeIconInPath(file.path);
            }

            await customRule.add(this, rule, file, undefined);
          });

          if (inheritance.doesExistInPath(this, file.path)) {
            const folderPath = inheritance.getFolderPathByFilePath(this, file.path);
            const folderInheritance = inheritance.getByPath(this, file.path);
            const iconName = folderInheritance.inheritanceIcon;
            dom.removeIconInPath(file.path);
            inheritance.add(this, folderPath, iconName, {
              file,
              onAdd: (file) => {
                if (this.getSettings().iconInTabsEnabled) {
                  iconTabs.add(this, file as TFile, { iconName });
                }
              },
            });
          }
        }),
      );

      // Register create event for checking inheritance functionality.
      this.registerEvent(
        this.app.vault.on('create', (file) => {
          const inheritanceFolders = Object.entries(this.data).filter(
            ([k, v]) => k !== 'settings' && typeof v === 'object',
          );

          if (!file.parent || file.parent.path === '/') return;

          inheritanceFolders.forEach(([path, obj]: [string, FolderIconObject]) => {
            inheritance.add(this, path, obj.inheritanceIcon, {
              file,
              onAdd: (file) => {
                if (this.getSettings().iconInTabsEnabled) {
                  iconTabs.add(this, file as TFile, { iconName: obj.inheritanceIcon });
                }
              },
            });
          });
        }),
      );

      // Register active leaf change event for adding icon of file to tab.
      this.registerEvent(
        this.app.workspace.on('active-leaf-change', (leaf: WorkspaceLeaf) => {
          if (!this.getSettings().iconInTabsEnabled) {
            return;
          }

          if (leaf.view.getViewType() !== 'markdown') {
            return;
          }

          const explorerLeaf = leaf as ExplorerLeaf;
          if (explorerLeaf.view.file) {
            iconTabs.add(this, explorerLeaf.view.file);
          }
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

    // Saves the icon name with prefix to remove it from the icon pack directory later.
    const iconData = this.data[path];

    if (typeof this.data[path] === 'object') {
      const currentValue = this.data[path] as FolderIconObject;
      this.data[path] = {
        ...currentValue,
        iconName: null,
      };
    } else {
      delete this.data[path];
    }

    // Removes the icon from the icon pack directory if it is not used as an icon somewhere
    // else.
    if (iconData) {
      let iconNameWithPrefix = iconData as string | FolderIconObject;
      if (typeof iconData === 'object') {
        iconNameWithPrefix = (iconData as FolderIconObject).iconName;
      } else {
        iconNameWithPrefix = iconData as string;
      }
      removeIconFromIconPack(this, iconNameWithPrefix);
    }

    //this.addIconsToSearch();
    this.saveIconFolderData();
  }

  addFolderIcon(path: string, icon: Icon | string): void {
    const iconName = typeof icon === 'object' ? icon.displayName : icon;

    // Check if inheritance is active for this path.
    if (typeof this.data[path] === 'object') {
      const currentValue = this.data[path] as FolderIconObject;
      this.data[path] = {
        ...currentValue,
        iconName,
      };
    } else {
      this.data[path] = iconName;
    }

    // Update recently used icons.
    if (!this.getSettings().recentlyUsedIcons.includes(iconName)) {
      if (this.getSettings().recentlyUsedIcons.length >= this.getSettings().recentlyUsedIconsSize) {
        this.getSettings().recentlyUsedIcons = this.getSettings().recentlyUsedIcons.slice(
          0,
          this.getSettings().recentlyUsedIconsSize - 1,
        );
      }

      this.getSettings().recentlyUsedIcons.unshift(iconName);
      this.checkRecentlyUsedIcons();
    }

    //this.addIconsToSearch();
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

  getRegisteredFileExplorers(): Set<ExplorerView> {
    return this.registeredFileExplorers;
  }

  /**
   * Returns a possible data path by the given value. This function checks for direct icon,
   * inheritance icon and custom rules.
   * @param value String that will be used to find the data path.
   * @returns String that is the data path or `undefined` if no data path was found.
   */
  getDataPathByValue(value: string): string | undefined {
    return Object.entries(this.data).find(([k, v]) => {
      if (typeof v === 'string') {
        if (value === v) {
          return k;
        }
      } else if (typeof v === 'object') {
        // Check for custom rules.
        if (k === 'settings') {
          // `rules` are defined in the settings object.
          const rules = (v as IconFolderSettings).rules;
          return rules.find((rule) => rule.icon === value);
        }

        // Check for inheritance icons.
        v = v as FolderIconObject;
        if (value === v.iconName || value === v.inheritanceIcon) {
          return k;
        }
      }
    }) as unknown as string;
  }
}
