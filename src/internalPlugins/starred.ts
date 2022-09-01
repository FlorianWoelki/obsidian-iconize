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

  register() {
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

            const { itemLookup, containerEl } = self.leaf;
            const navFileEls = containerEl.querySelectorAll('.nav-file');
            let el: Element | undefined;
            navFileEls.forEach((navFileEl) => {
              const lookupFile = itemLookup.get(navFileEl);
              if (!lookupFile) {
                return;
              }

              if (lookupFile.path === file.path) {
                el = navFileEl;
              }
            });

            const icon = getIconByPath(self.plugin, file.path);
            const iconNode = el?.querySelector('.nav-file-icon');
            if (!iconNode || !icon) {
              return;
            }

            insertIconToNode(self.plugin, icon, iconNode as HTMLElement);
          };
        },
      }),
    );
  }
}
