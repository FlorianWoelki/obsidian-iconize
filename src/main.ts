import {
  Plugin,
  MenuItem,
  TFile,
  WorkspaceLeaf,
  requireApiVersion,
  TFolder,
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
import inheritance from './lib/inheritance';
import dom from './lib/util/dom';
import customRule from './lib/custom-rule';
import icon from './lib/icon';
import BookmarkInternalPlugin from './internal-plugins/bookmark';
import {
  getAllOpenedFiles,
  removeIconFromIconPack,
  saveIconToIconPack,
} from '@app/util';
import config from '@app/config';
import titleIcon from './lib/icon-title';
import SuggestionIcon from './editor/icons-suggestion';
import emoji from './emoji';
import { IconCache } from './lib/icon-cache';
import {
  PositionField,
  buildIconPlugin,
  getField,
} from './editor/live-preview';
import {
  Header,
  calculateFontTextSize,
  calculateHeaderSize,
  calculateInlineTitleSize,
  isHeader,
} from './lib/util/text';
import svg from './lib/util/svg';

export interface FolderIconObject {
  iconName: string | null;
  inheritanceIcon: string;
}

export default class IconFolderPlugin extends Plugin {
  private data: Record<
    string,
    boolean | string | IconFolderSettings | FolderIconObject
  >;
  private registeredFileExplorers = new Set<ExplorerView>();

  private modifiedInternalPlugins: InternalPluginInjector[] = [];

  public positionField: PositionField = getField();

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
    setPath(this.getSettings().iconPacksPath);

    await createDefaultDirectory(this);
    await this.checkRecentlyUsedIcons();

    await migrate(this);

    const usedIconNames = icon.getAllWithPath(this).map((value) => value.icon);
    await loadUsedIcons(this, usedIconNames);

    this.app.workspace.onLayoutReady(() => this.handleChangeLayout());
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

        menu.addItem(addIconMenuItem);

        const filePathData = this.getData()[file.path];
        const inheritanceFolderHasIcon =
          typeof filePathData === 'object' &&
          (filePathData as FolderIconObject).iconName !== null;
        // Only add remove icon menu item when the file path exists in the data.
        // We do not want to show this menu item for e.g. inheritance or custom rules.
        if (
          filePathData &&
          (typeof filePathData === 'string' || inheritanceFolderHasIcon)
        ) {
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
                    const tabLeaves = iconTabs.getTabLeavesOfFilePath(
                      this,
                      file.path,
                    );
                    for (const tabLeaf of tabLeaves) {
                      iconTabs.remove(tabLeaf.tabHeaderInnerIconEl, {
                        replaceWithDefaultIcon: true,
                      });
                    }
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
                const iconName =
                  typeof icon === 'string' ? icon : icon.displayName;
                saveIconToIconPack(this, iconName);
                inheritance.add(this, file.path, iconName, {
                  onAdd: (file) => {
                    if (this.getSettings().iconInTabsEnabled) {
                      const tabLeaves = iconTabs.getTabLeavesOfFilePath(
                        this,
                        file.path,
                      );
                      for (const tabLeaf of tabLeaves) {
                        iconTabs.add(
                          this,
                          file as TFile,
                          tabLeaf.tabHeaderInnerIconEl,
                          {
                            iconName,
                          },
                        );
                      }
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

    // post-processing complete :icon: shortcodes in Notes
    this.registerMarkdownPostProcessor((element) => {
      // ignore if codeblock
      const codeElement = element.querySelector('pre > code');
      if (codeElement) {
        return;
      }

      const iconShortcodes = Array.from(
        element.innerHTML.matchAll(/(:)((\w{1,64}:\d{17,18})|(\w{1,64}))(:)/g),
      );

      for (let index = 0; index < iconShortcodes.length; index++) {
        const shortcode = iconShortcodes[index][0];
        const iconName = shortcode.slice(1, shortcode.length - 1);

        // Find icon and process it if exists
        const iconObject = icon.getIconByName(iconName);
        if (iconObject) {
          const tagName = element.firstElementChild.tagName.toLowerCase();
          let fontSize = calculateFontTextSize();

          if (isHeader(tagName)) {
            fontSize = calculateHeaderSize(tagName as Header);
            const svgElement = svg.setFontSize(iconObject.svgElement, fontSize);

            // Replace first element (DIV html content) with svg element
            element.firstElementChild.innerHTML =
              element.firstElementChild.innerHTML.replace(
                shortcode,
                svgElement,
              );
          } else {
            const svgElement = svg.setFontSize(iconObject.svgElement, fontSize);
            // Replace shortcode by svg element
            element.innerHTML = element.innerHTML.replace(
              shortcode,
              svgElement,
            );
          }
        }
      }
    });

    // Register shortcodes auto-completion suggestion in notes.
    this.registerEditorSuggest(new SuggestionIcon(this.app));

    this.registerEditorExtension([this.positionField, buildIconPlugin(this)]);

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

    // Check for possible inheritance and add the icon if an inheritance exists.
    if (inheritance.doesExistInPath(this, file.path)) {
      const folderPath = inheritance.getFolderPathByFilePath(this, file.path);
      const folderInheritance = inheritance.getByPath(this, file.path);
      const iconName = folderInheritance.inheritanceIcon;
      didUpdate = true;
      inheritance.add(this, folderPath, iconName, {
        file,
        onAdd: (file) => {
          // Update icon in tab when setting is enabled.
          if (this.getSettings().iconInTabsEnabled) {
            const tabLeaves = iconTabs.getTabLeavesOfFilePath(this, file.path);
            for (const tabLeaf of tabLeaves) {
              iconTabs.add(this, file as TFile, tabLeaf.tabHeaderInnerIconEl, {
                iconName,
              });
            }
          }

          // Update icon in title when setting is enabled.
          if (this.getSettings().iconInTitleEnabled) {
            this.addIconInTitle(iconName);
          }
        },
      });
    }

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

    // Only remove icon above titles and icon in tabs if no inheritance or custom rule was found.
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
              titleIcon.add(activeView.inlineTitleEl, possibleIcon, {
                fontSize: calculateInlineTitleSize(),
              });
            }
          }
        }
      }

      // Register rename event for adding icons with custom rules to the DOM and updating
      // inheritance when file was moved to another directory.
      this.registerEvent(
        this.app.vault.on('rename', async (file, oldPath) => {
          const inheritanceExists = inheritance.doesExistInPath(this, oldPath);
          if (inheritanceExists) {
            // Apply inheritance to the renamed file.
            const isFolder = (file as TFolder).children !== undefined;
            if (!isFolder) {
              const folderPath = inheritance.getFolderPathByFilePath(
                this,
                file.path,
              );
              const folderInheritance = inheritance.getByPath(this, file.path);
              const iconName = folderInheritance.inheritanceIcon;
              dom.removeIconInPath(file.path);
              inheritance.add(this, folderPath, iconName, {
                file,
                onAdd: (file) => {
                  if (this.getSettings().iconInTabsEnabled) {
                    const tabLeaves = iconTabs.getTabLeavesOfFilePath(
                      this,
                      file.path,
                    );

                    for (const tabLeaf of tabLeaves) {
                      iconTabs.add(
                        this,
                        file as TFile,
                        tabLeaf.tabHeaderInnerIconEl,
                        {
                          iconName,
                        },
                      );
                    }
                  }
                },
              });
            }
          } else {
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
              const applicable = await customRule.isApplicable(
                this,
                rule,
                file,
              );
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
          }
        }),
      );

      // Register create event for checking inheritance functionality.
      this.registerEvent(
        this.app.vault.on('create', (file) => {
          const inheritanceFolders = Object.entries(this.data).filter(
            ([k, v]) => k !== 'settings' && typeof v === 'object',
          );

          const isFolder = (file as TFolder).children !== undefined;

          if (!file.parent || file.parent.path === '/' || isFolder) return;

          inheritanceFolders.forEach(
            ([path, obj]: [string, FolderIconObject]) => {
              inheritance.add(this, path, obj.inheritanceIcon, {
                file,
                onAdd: (file) => {
                  if (this.getSettings().iconInTabsEnabled) {
                    const tabLeaves = iconTabs.getTabLeavesOfFilePath(
                      this,
                      file.path,
                    );
                    for (const tabLeaf of tabLeaves) {
                      iconTabs.add(
                        this,
                        file as TFile,
                        tabLeaf.tabHeaderInnerIconEl,
                        {
                          iconName: obj.inheritanceIcon,
                        },
                      );
                    }
                  }
                },
              });
            },
          );
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
                titleIcon.add(view.inlineTitleEl, foundIcon, {
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
            iconTabs.add(this, openedFile, leaf.tabHeaderInnerIconEl);
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
              titleIcon.add(leaf.inlineTitleEl, foundIcon, {
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
            const { icon: newIconName } = fileCache.frontmatter;
            // If `icon` property is empty, we will remove it from the data and remove the icon.
            if (!newIconName) {
              await this.removeSingleIcon(file);
              return;
            }

            if (typeof newIconName !== 'string') {
              new Notice(
                `[${config.PLUGIN_NAME}] Frontmatter property type \`icon\` has to be of type \`text\`.`,
              );
              return;
            }

            const cachedIcon = IconCache.getInstance().get(file.path);
            if (newIconName === cachedIcon?.iconNameWithPrefix) {
              return;
            }

            try {
              if (!emoji.isEmoji(newIconName)) {
                saveIconToIconPack(this, newIconName);
              }
            } catch (e) {
              console.error(e);
              new Notice(e.message);
              return;
            }

            dom.createIconNode(this, file.path, newIconName);
            this.addFolderIcon(file.path, newIconName);
            IconCache.getInstance().set(file.path, {
              iconNameWithPrefix: newIconName,
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
              iconTabs.add(this, openedFile, leaf.tabHeaderInnerIconEl);
            }
            return;
          }

          if (leaf.view.getViewType() !== 'markdown') {
            return;
          }

          const tabHeaderLeaf = leaf as TabHeaderLeaf;
          if (tabHeaderLeaf.view.file) {
            iconTabs.add(
              this,
              tabHeaderLeaf.view.file,
              tabHeaderLeaf.tabHeaderInnerIconEl,
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
          titleIcon.add(activeView.inlineTitleEl, possibleIcon, {
            fontSize: calculateInlineTitleSize(),
          });
        }
      }
    }
  }

  private saveInheritanceData(
    folderPath: string,
    icon: Icon | string | null,
  ): void {
    const currentValue = this.data[folderPath];
    // if icon is null, it will remove the inheritance icon from the data
    if (icon === null && currentValue && typeof currentValue === 'object') {
      const folderObject = currentValue as FolderIconObject;

      if (folderObject.iconName) {
        this.data[folderPath] = getNormalizedName(folderObject.iconName);
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
            inheritanceIcon: getNormalizedName(
              typeof icon === 'object' ? icon.displayName : icon,
            ),
          };
        }
        // check if it has already a inheritance icon
        else if (folderPath !== 'settings') {
          this.data[folderPath] = {
            ...(currentValue as FolderIconObject),
            inheritanceIcon: getNormalizedName(
              typeof icon === 'object' ? icon.displayName : icon,
            ),
          };
        }
      } else {
        this.data[folderPath] = {
          iconName: null,
          inheritanceIcon: getNormalizedName(
            typeof icon === 'object' ? icon.displayName : icon,
          ),
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

    Object.defineProperty(
      this.data,
      newPath,
      Object.getOwnPropertyDescriptor(this.data, oldPath),
    );
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
