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

  private setIcon(filePath: string, node: Element | undefined): void {
    const iconName = icon.getByPath(this.plugin, filePath);
    const iconNode = node.querySelector('.tree-item-icon');
    if (!iconNode || !iconName) {
      return;
    }

    dom.setIconForNode(this.plugin, iconName, iconNode as HTMLElement);
  }

  private computeNodesWithPath(callback: (node: HTMLElement, filePath: string) => void): void {
    if (!this.leaf) {
      return;
    }

    const { itemDoms, containerEl } = this.leaf;
    // Retrieves all the items of the bookmark plugin which areo objects.
    const items = this.bookmark.instance.items;
    items.forEach((item) => {
      const lookupItem = itemDoms.get(item);
      if (!lookupItem) {
        return;
      }

      callback(lookupItem.el, item.path);
    });
  }

  onMount(): void {
    const nodesWithPath: { [key: string]: HTMLElement } = {};
    this.computeNodesWithPath((node, filePath) => {
      nodesWithPath[filePath] = node;
    });

    Object.entries(nodesWithPath).forEach(([filePath, node]) => this.setIcon(filePath, node));
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
