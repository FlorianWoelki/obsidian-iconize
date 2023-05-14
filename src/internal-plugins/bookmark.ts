import { around } from 'monkey-around';
import { View } from 'obsidian';
import InternalPluginInjector from '@app/@types/internalPluginInjector';
import { BookmarkItem, BookmarkItemValue } from '@app/@types/obsidian';
import dom from '@lib/util/dom';
import icon from '@lib/icon';
import IconFolderPlugin from '@app/main';
import MetaData from '@app/MetaData';

interface BookmarksView extends View {
  itemDoms: WeakMap<BookmarkItem, BookmarkItemValue>;
}

export default class BookmarkInternalPlugin extends InternalPluginInjector {
  constructor(plugin: IconFolderPlugin) {
    super(plugin);
  }

  get bookmark() {
    return this.plugin.app.internalPlugins.getPluginById('bookmarks');
  }

  get enabled() {
    return this.plugin.app.internalPlugins.getPluginById('bookmarks').enabled;
  }

  get leaf(): BookmarksView | undefined {
    const leaf = this.plugin.app.workspace.getLeavesOfType('bookmarks');
    if (!leaf) {
      return undefined;
    }

    if (leaf.length === 1) {
      return leaf[0].view as BookmarksView;
    }

    return undefined;
  }

  private setIconOrRemove(filePath: string, node: Element | undefined): void {
    const iconName = icon.getByPath(this.plugin, filePath);
    let iconNode = node.querySelector('.tree-item-icon');
    if (!iconName) {
      if (iconNode) {
        iconNode.remove();
      }
      return;
    }

    // If the icon node is not defined, then we need to recreate it.
    if (!iconNode) {
      // Get the tree-item-self element where the original icon is set.
      const treeItemSelf = node.querySelector('.tree-item-self');
      if (!treeItemSelf) {
        return;
      }

      iconNode = node.createDiv({ cls: 'tree-item-icon' });
      // Prepends the icon to the tree-item-self element as a first child.
      treeItemSelf.prepend(iconNode);
    }

    dom.setIconForNode(this.plugin, iconName, iconNode as HTMLElement);
  }

  private computeNodesWithPath(callback: (node: HTMLElement, filePath: string) => void): void {
    if (!this.leaf) {
      return;
    }

    /**
     * Retrieves the lookup item from the bookmark plugin and calls the callback with the
     * element and the path of the item.
     * @param item BookmarkItem object which can be a folder or a file.
     * @param itemDoms WeakMap of the bookmark plugin which contains the lookup item.
     */
    const retrieveLookupItem = (item: BookmarkItem, itemDoms: WeakMap<BookmarkItem, BookmarkItemValue>): void => {
      const lookupItem = itemDoms.get(item);
      if (!lookupItem) {
        return;
      }

      if (item.items) {
        // If the item is a folder, then we need to retrieve all the items inside it.
        for (const subItem of item.items) {
          retrieveLookupItem(subItem, itemDoms);
        }
      }

      // If the item is a `file` or a `folder` (not of type `group`), then we can call the callback.
      if (item.type === 'file' || item.type === 'folder') {
        callback(lookupItem.el, item.path);
      }
    };

    const { itemDoms, containerEl } = this.leaf;
    // Retrieves all the items of the bookmark plugin which areo objects.
    const items = this.bookmark.instance.items;
    items.forEach((item) => {
      retrieveLookupItem(item, itemDoms);
    });
  }

  onMount(): void {
    const nodesWithPath: { [key: string]: HTMLElement } = {};
    this.computeNodesWithPath((node, filePath) => {
      nodesWithPath[filePath] = node;
    });

    Object.entries(nodesWithPath).forEach(([filePath, node]) => this.setIconOrRemove(filePath, node));
  }

  register(): void {
    if (!this.plugin.app.internalPlugins.getPluginById('file-explorer').enabled) {
      console.info(
        `[${MetaData.pluginName}/Bookmarks] Skipping bookmark internal plugin registration because file-explorer is not enabled.`,
      );
      return;
    }

    if (!this.enabled) {
      console.info(
        `[${MetaData.pluginName}/Bookmarks] Skipping bookmark internal plugin registration because it's not enabled.`,
      );
      return;
    }

    const self = this;
    this.plugin.register(
      around(this.bookmark.instance, {
        addItem: function (next) {
          return function (file) {
            next.call(this, file);
            self.onMount();
          };
        },
        removeItem: function (next) {
          return function (file) {
            next.call(this, file);
            self.onMount();
          };
        },
      }),
    );
  }
}
