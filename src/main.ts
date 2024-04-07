import {
  Plugin,
  MenuItem,
  TFile,
  WorkspaceLeaf,
  requireApiVersion,
  MarkdownView,
  Notice,
} from 'obsidian';
import {
  ExplorerView,
  InlineTitleView,
  TabHeaderLeaf,
} from './@types/obsidian';
import {
  createDefaultDirectory,
  getNormalizedName,
  getPreloadedIcons,
  getSvgFromLoadedIcon,
  initIconPacks,
  loadUsedIcons,
  nextIdentifier,
  resetPreloadedIcons,
  setPath,
} from './icon-pack-manager';
import IconsPickerModal, { Icon } from './ui/icons-picker-modal';
import { DEFAULT_SETTINGS, IconFolderSettings } from '@app/settings/data';
import { migrate } from '@app/migrations';
import IconFolderSettingsUI from './settings/ui';
import StarredInternalPlugin from './internal-plugins/starred';
import InternalPluginInjector from './@types/internal-plugin-injector';
import iconTabs from './lib/icon-tabs';
import dom from './lib/util/dom';
import customRule from './lib/custom-rule';
import icon from './lib/icon';
import BookmarkInternalPlugin from './internal-plugins/bookmark';
import {
  getAllOpenedFiles,
  isHexadecimal,
  removeIconFromIconPack,
  saveIconToIconPack,
  stringToHex,
} from '@app/util';
import config from '@app/config';
import titleIcon from './lib/icon-title';
import SuggestionIcon from './editor/icons-suggestion';
import emoji from './emoji';
import { IconCache } from './lib/icon-cache';
import {
  buildIconInLinksPlugin,
  buildIconInTextPlugin,
} from './editor/live-preview';
import { PositionField, buildPositionField } from './editor/live-preview/state';
import { calculateInlineTitleSize } from './lib/util/text';
import {
  processIconInTextMarkdown,
  processIconInLinkMarkdown,
} from './editor/markdown-processors';
import ChangeColorModal from './ui/change-color-modal';
import { logger } from './lib/logger';

export interface FolderIconObject {
  iconName: string | null;
  iconColor?: string;
}

export default class IconFolderPlugin extends Plugin {
  private data: Record<
    string,
    boolean | string | IconFolderSettings | FolderIconObject
  >;
  private registeredFileExplorers = new Set<ExplorerView>();

  private modifiedInternalPlugins: InternalPluginInjector[] = [];

  public positionField: PositionField = buildPositionField(this);

  private frontmatterCache = new Set<string>();

  async onload() {
    console.log(`loading ${config.PLUGIN_NAME}`);

    // Registers all modified internal plugins.
    // Only adds star plugin for obsidian under v0.12.6.
    if (!requireApiVersion('0.12.6')) {
      this.modifiedInternalPlugins.push(new StarredInternalPlugin(this));
    } else if (requireApiVersion('1.2.0')) {
      this.modifiedInternalPlugins.push(new BookmarkInternalPlugin(this));
    }

    await this.loadIconFolderData();
    logger.toggleLogging(this.getSettings().debugMode);
    setPath(this.getSettings().iconPacksPath);

    await createDefaultDirectory(this);
    await this.checkRecentlyUsedIcons();

    await migrate(this);

    const usedIconNames = icon.getAllWithPath(this).map((value) => value.icon);
    await loadUsedIcons(this, usedIconNames);

    this.app.workspace.onLayoutReady(() => this.handleChangeLayout());

    this.registerEvent(
      // Registering file menu event for listening to file pinning and unpinning.
      this.app.workspace.on('file-menu', (menu, file) => {
        // I've researched other ways of doing this. However, there is no other way to listen to file pinning and unpinning.
        menu.onHide(() => {
          const path = file.path;
          if (this.getSettings().iconInTabsEnabled) {
            for (const openedFile of getAllOpenedFiles(this)) {
              if (openedFile.path === path) {
                const possibleIcon = IconCache.getInstance().get(path);
                if (!possibleIcon) {
                  return;
                }
                const tabLeaves = iconTabs.getTabLeavesOfFilePath(
                  this,
                  file.path,
                );
                for (const tabLeaf of tabLeaves) {
                  // Add timeout to ensure that the default icon is already set.
                  setTimeout(() => {
                    iconTabs.add(
                      this,
                      file as TFile,
                      tabLeaf.tabHeaderInnerIconEl,
                    );
                  }, 5);
                }
              }
            }
          }
        });
      }),
    );

    this.registerEvent(
      this.app.workspace.on('layout-change', () => this.handleChangeLayout()),
    );

    this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file: TFile) => {
        const addIconMenuItem = (item: MenuItem) => {
          item.setTitle('Change icon');
          item.setIcon('hashtag');
          item.onClick(() => {
            const modal = new IconsPickerModal(this.app, this, file.path);
            modal.open();

            modal.onSelect = (iconName: string): void => {
              IconCache.getInstance().set(file.path, {
                iconNameWithPrefix: iconName,
              });

              // Update icon in tab when setting is enabled.
              if (this.getSettings().iconInTabsEnabled) {
                const tabLeaves = iconTabs.getTabLeavesOfFilePath(
                  this,
                  file.path,
                );
                for (const tabLeaf of tabLeaves) {
                  iconTabs.update(this, iconName, tabLeaf.tabHeaderInnerIconEl);
                }
              }

              // Update icon in title when setting is enabled.
              if (this.getSettings().iconInTitleEnabled) {
                this.addIconInTitle(iconName);
              }
            };
          });
        };

        const removeIconMenuItem = (item: MenuItem) => {
          item.setTitle('Remove icon');
          item.setIcon('trash');
          item.onClick(async () => {
            await this.removeSingleIcon(file);
          });
        };

        const changeColorOfIcon = (item: MenuItem) => {
          item.setTitle('Change color of icon');
          item.setIcon('palette');
          item.onClick(() => {
            const modal = new ChangeColorModal(this.app, this, file.path);
            modal.open();
          });
        };

        menu.addItem(addIconMenuItem);

        const filePathData = this.getData()[file.path];
        const hasNestedIcon =
          typeof filePathData === 'object' &&
          (filePathData as FolderIconObject).iconName !== null;
        // Only add remove icon menu item when the file path exists in the data.
        // We do not want to show this menu item for e.g. custom rules.
        if (
          filePathData &&
          (typeof filePathData === 'string' || hasNestedIcon)
        ) {
          const icon =
            typeof filePathData === 'string'
              ? filePathData
              : (filePathData as FolderIconObject).iconName;
          if (!emoji.isEmoji(icon)) {
            menu.addItem(changeColorOfIcon);
          }

          menu.addItem(removeIconMenuItem);
        }
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
        // Check if the file was moved and had an icon before.
        const dataPoint = this.data[oldPath];
        if (dataPoint && oldPath !== 'settings') {
          const iconNameWithPrefix =
            typeof dataPoint === 'object'
              ? (dataPoint as FolderIconObject).iconName
              : (dataPoint as string);
          dom.createIconNode(this, file.path, iconNameWithPrefix);
        }

        this.renameFolder(file.path, oldPath);
      }),
    );

    if (this.getSettings().iconsInNotesEnabled) {
      this.registerMarkdownPostProcessor((el) =>
        processIconInTextMarkdown(this, el),
      );
      this.registerEditorSuggest(new SuggestionIcon(this.app, this));
      this.registerEditorExtension([
        this.positionField,
        buildIconInTextPlugin(this),
      ]);
    }

    if (this.getSettings().iconsInLinksEnabled) {
      this.registerMarkdownPostProcessor((el, ctx) =>
        processIconInLinkMarkdown(this, el, ctx),
      );
      this.registerEditorExtension([
        this.positionField,
        buildIconInLinksPlugin(this),
      ]);
    }

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

  private async removeSingleIcon(file: TFile): Promise<void> {
    this.removeFolderIcon(file.path);
    dom.removeIconInPath(file.path);
    IconCache.getInstance().invalidate(file.path);
    this.notifyPlugins();

    let didUpdate = false;

    // Refreshes the icon tab and title icon for custom rules.
    for (const rule of customRule.getSortedRules(this)) {
      const applicable = await customRule.isApplicable(this, rule, file);
      if (applicable) {
        customRule.add(this, rule, file);
        this.addIconInTitle(rule.icon);
        const tabLeaves = iconTabs.getTabLeavesOfFilePath(this, file.path);
        for (const tabLeaf of tabLeaves) {
          iconTabs.add(this, file as TFile, tabLeaf.tabHeaderInnerIconEl, {
            iconName: rule.icon,
          });
        }
        didUpdate = true;
        break;
      }
    }

    // Only remove icon above titles and icon in tabs if no custom rule was found.
    if (!didUpdate) {
      // Refreshes icons above title and icons in tabs.
      for (const openedFile of getAllOpenedFiles(this)) {
        if (this.getSettings().iconInTitleEnabled) {
          titleIcon.remove(
            (openedFile.leaf.view as InlineTitleView).inlineTitleEl,
          );
        }
        if (this.getSettings().iconInTabsEnabled) {
          const leaf = openedFile.leaf as TabHeaderLeaf;
          iconTabs.remove(leaf.tabHeaderInnerIconEl, {
            replaceWithDefaultIcon: true,
          });
        }
      }
    }
  }

  private handleChangeLayout(): void {
    // Transform data that are objects to single strings.
    const data = Object.entries(this.data) as [
      string,
      string | FolderIconObject,
    ][];

    this.modifiedInternalPlugins.forEach((internalPlugin) => {
      if (internalPlugin.enabled) {
        internalPlugin.onMount();
        internalPlugin.register();
      }
    });

    icon.addAll(this, data, this.registeredFileExplorers, () => {
      // After initialization of the icon packs, checks the vault for missing icons and
      // adds them.
      initIconPacks(this).then(async () => {
        if (this.getSettings().iconsBackgroundCheckEnabled) {
          const data = Object.entries(this.data) as [
            string,
            string | FolderIconObject,
          ][];
          await icon.checkMissingIcons(this, data);
          resetPreloadedIcons();
        }
      });

      if (this.getSettings().iconInFrontmatterEnabled) {
        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile) {
          this.frontmatterCache.add(activeFile.path);
        }
      }

      // Adds the title icon to the active leaf view.
      if (this.getSettings().iconInTitleEnabled) {
        for (const openedFile of getAllOpenedFiles(this)) {
          const iconName = icon.getByPath(this, openedFile.path);
          const activeView = openedFile.leaf.view as InlineTitleView;
          if (activeView instanceof MarkdownView && iconName) {
            let possibleIcon: string = iconName;
            if (!emoji.isEmoji(iconName)) {
              const iconNextIdentifier = nextIdentifier(iconName);
              possibleIcon = getSvgFromLoadedIcon(
                iconName.substring(0, iconNextIdentifier),
                iconName.substring(iconNextIdentifier),
              );
            }

            if (possibleIcon) {
              titleIcon.add(this, activeView.inlineTitleEl, possibleIcon, {
                fontSize: calculateInlineTitleSize(),
              });
            }
          }
        }
      }

      // Register rename event for adding icons with custom rules to the DOM
      // when file was moved to another directory.
      this.registerEvent(
        this.app.vault.on('rename', async (file, oldPath) => {
          const sortedRules = customRule.getSortedRules(this);

          // Removes possible icons from the renamed file.
          sortedRules.forEach((rule) => {
            if (customRule.doesMatchPath(rule, oldPath)) {
              dom.removeIconInPath(file.path);
            }
          });

          // Adds possible icons to the renamed file.
          sortedRules.forEach((rule) => {
            if (customRule.doesMatchPath(rule, oldPath)) {
              return;
            }

            customRule.add(this, rule, file, undefined);
          });

          // Updates icon tabs for the renamed file.
          for (const rule of customRule.getSortedRules(this)) {
            const applicable = await customRule.isApplicable(this, rule, file);
            if (!applicable) {
              continue;
            }

            const openedFiles = getAllOpenedFiles(this);
            const openedFile = openedFiles.find(
              (openedFile) => openedFile.path === file.path,
            );
            if (openedFile) {
              const leaf = openedFile.leaf as TabHeaderLeaf;
              iconTabs.update(this, rule.icon, leaf.tabHeaderInnerIconEl);
            }
            break;
          }
        }),
      );

      // Register `layout-change` event for adding icons to tabs when moving a pane or
      // enabling reading mode.
      this.registerEvent(
        this.app.workspace.on('layout-change', () => {
          if (this.getSettings().iconInTitleEnabled) {
            const activeView =
              this.app.workspace.getActiveViewOfType(MarkdownView);
            if (activeView) {
              const file = activeView.file;
              const view = (activeView.leaf.view as any).currentMode
                .view as InlineTitleView;
              const iconNameWithPrefix = icon.getByPath(this, file.path);
              if (!iconNameWithPrefix) {
                titleIcon.hide(view.inlineTitleEl);
                return;
              }

              let foundIcon: string = iconNameWithPrefix;
              if (!emoji.isEmoji(foundIcon)) {
                foundIcon = icon.getIconByName(iconNameWithPrefix)?.svgElement;
                // Check for preloaded icons if no icon was found when the start up was faster
                // than the loading of the icons.
                if (!foundIcon && getPreloadedIcons().length > 0) {
                  foundIcon = getPreloadedIcons().find(
                    (icon) => icon.prefix + icon.name === iconNameWithPrefix,
                  )?.svgElement;
                }
              }

              if (foundIcon) {
                // Removes the node because the editor markdown content is being rerendered
                // when the content mode changes back to editing.
                titleIcon.remove(view.inlineTitleEl);
                titleIcon.add(this, view.inlineTitleEl, foundIcon, {
                  fontSize: calculateInlineTitleSize(),
                });
              }
            }
          }

          if (!this.getSettings().iconInTabsEnabled) {
            return;
          }

          for (const openedFile of getAllOpenedFiles(this)) {
            const leaf = openedFile.leaf as TabHeaderLeaf;
            const iconColor = this.getIconColor(leaf.view.file.path);
            iconTabs.add(this, openedFile, leaf.tabHeaderInnerIconEl, {
              iconColor,
            });
          }
        }),
      );

      // Register `file-open` event for adding icon to title.
      this.registerEvent(
        this.app.workspace.on('file-open', (file) => {
          if (!this.getSettings().iconInTitleEnabled) {
            return;
          }

          for (const openedFile of getAllOpenedFiles(this)) {
            if (openedFile.path !== file.path) {
              continue;
            }

            const leaf = openedFile.leaf.view as InlineTitleView;
            const iconNameWithPrefix = icon.getByPath(this, file.path);
            if (!iconNameWithPrefix) {
              titleIcon.hide(leaf.inlineTitleEl);
              return;
            }

            let foundIcon: string = iconNameWithPrefix;
            if (!emoji.isEmoji(foundIcon)) {
              foundIcon = icon.getIconByName(iconNameWithPrefix)?.svgElement;
              // Check for preloaded icons if no icon was found when the start up was faster
              // than the loading of the icons.
              if (!foundIcon && getPreloadedIcons().length > 0) {
                foundIcon = getPreloadedIcons().find(
                  (icon) => icon.prefix + icon.name === iconNameWithPrefix,
                )?.svgElement;
              }
            }

            if (foundIcon) {
              titleIcon.add(this, leaf.inlineTitleEl, foundIcon, {
                fontSize: calculateInlineTitleSize(),
              });
            } else {
              titleIcon.hide(leaf.inlineTitleEl);
            }
          }
        }),
      );

      // Register event for frontmatter icon registration.
      this.registerEvent(
        this.app.metadataCache.on('resolve', async (file) => {
          if (!this.getSettings().iconInFrontmatterEnabled) {
            return;
          }

          const fileCache = this.app.metadataCache.getFileCache(file);
          if (fileCache?.frontmatter) {
            const { icon: newIconName, iconColor: newIconColor } =
              fileCache.frontmatter;
            // If `icon` property is empty, we will remove it from the data and remove the icon.
            if (!newIconName) {
              if (this.frontmatterCache.has(file.path)) {
                await this.removeSingleIcon(file);
                this.frontmatterCache.delete(file.path);
              }
              return;
            }

            if (typeof newIconName !== 'string') {
              new Notice(
                `[${config.PLUGIN_NAME}] Frontmatter property type \`icon\` has to be of type \`text\`.`,
              );
              return;
            }

            if (newIconColor && typeof newIconColor !== 'string') {
              new Notice(
                `[${config.PLUGIN_NAME}] Frontmatter property type \`iconColor\` has to be of type \`text\`.`,
              );
              return;
            }

            let iconColor = newIconColor;
            if (isHexadecimal(iconColor)) {
              iconColor = stringToHex(iconColor);
            }

            const cachedIcon = IconCache.getInstance().get(file.path);
            if (
              newIconName === cachedIcon?.iconNameWithPrefix &&
              iconColor === cachedIcon?.iconColor
            ) {
              return;
            }

            this.frontmatterCache.add(file.path);
            try {
              if (!emoji.isEmoji(newIconName)) {
                saveIconToIconPack(this, newIconName);
              }
            } catch (e) {
              console.error(e);
              new Notice(e.message);
              return;
            }

            dom.createIconNode(this, file.path, newIconName, {
              color: iconColor,
            });
            this.addFolderIcon(file.path, newIconName);
            this.addIconColor(file.path, iconColor);
            IconCache.getInstance().set(file.path, {
              iconNameWithPrefix: newIconName,
              iconColor,
            });

            // Update icon in tab when setting is enabled.
            if (this.getSettings().iconInTabsEnabled) {
              const tabLeaves = iconTabs.getTabLeavesOfFilePath(
                this,
                file.path,
              );
              for (const tabLeaf of tabLeaves) {
                iconTabs.update(
                  this,
                  newIconName,
                  tabLeaf.tabHeaderInnerIconEl,
                );
              }
            }

            // Update icon in title when setting is enabled.
            if (this.getSettings().iconInTitleEnabled) {
              this.addIconInTitle(newIconName);
            }
          }
        }),
      );

      // Register active leaf change event for adding icon of file to tab.
      this.registerEvent(
        this.app.workspace.on('active-leaf-change', (leaf: WorkspaceLeaf) => {
          if (!this.getSettings().iconInTabsEnabled) {
            return;
          }

          // TODO: Maybe change in the future to a more optimal solution.
          // Fixes a problem when the file was clicked twice in the same tab.
          // See https://github.com/FlorianWoelki/obsidian-iconize/issues/208.
          if (leaf.view.getViewType() === 'file-explorer') {
            for (const openedFile of getAllOpenedFiles(this)) {
              const leaf = openedFile.leaf as TabHeaderLeaf;
              const iconColor = this.getIconColor(leaf.view.file.path);
              iconTabs.add(this, openedFile, leaf.tabHeaderInnerIconEl, {
                iconColor,
              });
            }
            return;
          }

          if (leaf.view.getViewType() !== 'markdown') {
            return;
          }

          const tabHeaderLeaf = leaf as TabHeaderLeaf;
          if (tabHeaderLeaf.view.file) {
            const iconColor = this.getIconColor(tabHeaderLeaf.view.file.path);
            iconTabs.add(
              this,
              tabHeaderLeaf.view.file,
              tabHeaderLeaf.tabHeaderInnerIconEl,
              {
                iconColor,
              },
            );
          }
        }),
      );

      this.registerEvent(
        this.app.workspace.on('css-change', () => {
          for (const openedFile of getAllOpenedFiles(this)) {
            const activeView = openedFile.leaf.view as InlineTitleView;
            if (activeView instanceof MarkdownView) {
              titleIcon.updateStyle(activeView.inlineTitleEl, {
                fontSize: calculateInlineTitleSize(),
              });
            }
          }
        }),
      );
    });
  }

  addIconInTitle(iconName: string): void {
    for (const openedFile of getAllOpenedFiles(this)) {
      const activeView = openedFile.leaf.view as InlineTitleView;
      if (activeView instanceof MarkdownView) {
        let possibleIcon = iconName;
        if (!emoji.isEmoji(iconName)) {
          possibleIcon = icon.getIconByName(iconName)?.svgElement;
        }

        if (possibleIcon) {
          titleIcon.add(this, activeView.inlineTitleEl, possibleIcon, {
            fontSize: calculateInlineTitleSize(),
          });
        }
      }
    }
  }

  onunload() {
    console.log('unloading obsidian-icon-folder');
  }

  renameFolder(newPath: string, oldPath: string): void {
    if (!this.data[oldPath] || newPath === oldPath) {
      return;
    }

    Object.defineProperty(
      this.data,
      newPath,
      Object.getOwnPropertyDescriptor(this.data, oldPath),
    );
    delete this.data[oldPath];
    this.saveIconFolderData();
  }

  addIconColor(path: string, iconColor: string): void {
    const pathData = this.getData()[path];

    if (typeof pathData === 'string') {
      this.getData()[path] = {
        iconName: pathData,
        iconColor,
      };
    } else {
      (pathData as FolderIconObject).iconColor = iconColor;
    }

    this.saveIconFolderData();
  }

  getIconColor(path: string): string | undefined {
    const pathData = this.getData()[path];

    if (!pathData) {
      return undefined;
    }

    if (typeof pathData === 'string') {
      return undefined;
    }

    return (pathData as FolderIconObject).iconColor;
  }

  removeIconColor(path: string): void {
    const pathData = this.getData()[path];

    if (typeof pathData === 'string') {
      return;
    }

    const currentValue = pathData as FolderIconObject;
    this.getData()[path] = currentValue.iconName;

    this.saveIconFolderData();
  }

  removeFolderIcon(path: string): void {
    if (!this.data[path]) {
      return;
    }

    // Saves the icon name with prefix to remove it from the icon pack directory later.
    const iconData = this.data[path];

    delete this.data[path];

    // Removes the icon from the icon pack directory if it is not used as an icon somewhere
    // else.
    if (iconData) {
      let iconNameWithPrefix = iconData as string | FolderIconObject;
      if (typeof iconData === 'object') {
        iconNameWithPrefix = (iconData as FolderIconObject).iconName;
      } else {
        iconNameWithPrefix = iconData as string;
      }

      if (!emoji.isEmoji(iconNameWithPrefix)) {
        removeIconFromIconPack(this, iconNameWithPrefix);
      }
    }

    //this.addIconsToSearch();
    this.saveIconFolderData();
  }

  addFolderIcon(path: string, icon: Icon | string): void {
    const iconName = getNormalizedName(
      typeof icon === 'object' ? icon.displayName : icon,
    );

    this.data[path] = iconName;

    // Update recently used icons.
    if (!this.getSettings().recentlyUsedIcons.includes(iconName)) {
      if (
        this.getSettings().recentlyUsedIcons.length >=
        this.getSettings().recentlyUsedIconsSize
      ) {
        this.getSettings().recentlyUsedIcons =
          this.getSettings().recentlyUsedIcons.slice(
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
        if (data.settings[k] === undefined) {
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
    if (
      this.getSettings().recentlyUsedIcons.length >
      this.getSettings().recentlyUsedIconsSize
    ) {
      this.getSettings().recentlyUsedIcons =
        this.getSettings().recentlyUsedIcons.slice(
          0,
          this.getSettings().recentlyUsedIconsSize,
        );
      await this.saveIconFolderData();
    }
  }

  getData(): Record<
    string,
    boolean | string | IconFolderSettings | FolderIconObject
  > {
    return this.data;
  }

  getIconNameFromPath(path: string): string | undefined {
    if (typeof this.getData()[path] === 'object') {
      return (this.getData()[path] as FolderIconObject).iconName;
    }

    return this.getData()[path] as string;
  }

  getRegisteredFileExplorers(): Set<ExplorerView> {
    return this.registeredFileExplorers;
  }

  /**
   * Returns a possible data path by the given value. This function checks for
   * direct icon and custom rules.
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

        v = v as FolderIconObject;
        if (value === v.iconName) {
          return k;
        }
      }
    }) as unknown as string;
  }
}
