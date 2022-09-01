import { around } from 'monkey-around';
import { View } from 'obsidian';
import InternalPluginInjector from '../@types/internalPluginInjector';
import { StarredFile } from '../@types/obsidian';
import IconFolderPlugin from '../main';
import MetaData from '../MetaData';
import { getIconByPath, insertIconToNode } from '../util';

interface StarredView extends View {
  itemLookup: WeakMap<Element, StarredFile>;
}

export default class StarredInternalPlugin extends InternalPluginInjector {
  constructor(plugin: IconFolderPlugin) {
    super(plugin);
  }

  get starred() {
    return this.plugin.app.internalPlugins.getPluginById('starred');
  }

  get enabled() {
    return this.plugin.app.internalPlugins.getPluginById('starred').enabled;
  }

  get leaf(): StarredView | undefined {
    const leaf = this.plugin.app.workspace.getLeavesOfType('starred');
    if (!leaf) {
      return undefined;
    }

    if (leaf.length === 1) {
      return leaf[0].view as StarredView;
    }

    return undefined;
  }

  private setIcon(filePath: string, node: Element | undefined): void {
    const icon = getIconByPath(this.plugin, filePath);
    const iconNode = node.querySelector('.nav-file-icon');
    if (!iconNode || !icon) {
      return;
    }

    insertIconToNode(this.plugin, icon, iconNode as HTMLElement);
  }

  private computeNodesWithPath(callback: (node: Element, filePath: string) => void): void {
    const { itemLookup, containerEl } = this.leaf;
    const navFileEls = containerEl.querySelectorAll('.nav-file');
    navFileEls.forEach((navFileEl) => {
      const lookupFile = itemLookup.get(navFileEl);
      if (!lookupFile) {
        return;
      }

      callback(navFileEl, lookupFile.path);
    });
  }

  onMount(): void {
    const nodesWithPath: { [key: string]: Element } = {};
    this.computeNodesWithPath((node, filePath) => {
      nodesWithPath[filePath] = node;
    });

    Object.entries(nodesWithPath).forEach(([filePath, node]) => this.setIcon(filePath, node as HTMLElement));
  }

  register(): void {
    if (!this.plugin.app.internalPlugins.getPluginById('file-explorer').enabled) {
      console.info(
        `[${MetaData.pluginName}/Starred] Skipping starred internal plugin registration because file-explorer is not enabled.`,
      );
      return;
    }

    if (!this.enabled) {
      console.info(
        `[${MetaData.pluginName}/Starred] Skipping starred internal plugin registration because it's not enabled.`,
      );
      return;
    }

    const self = this;
    this.plugin.register(
      around(this.starred.instance, {
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
