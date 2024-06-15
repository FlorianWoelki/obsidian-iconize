import InternalPluginInjector from '@app/@types/internal-plugin-injector';
import { createIconShortcodeRegex } from '@app/editor/markdown-processors';
import icon from '@app/lib/icon';
import { logger } from '@app/lib/logger';
import IconFolderPlugin from '@app/main';
import { View } from 'obsidian';

const TREE_ITEM_CLASS = 'tree-item-self';
const TREE_ITEM_INNER = 'tree-item-inner';

interface OutlineView extends View {
  tree: {
    containerEl: HTMLDivElement;
  };
}

export default class OutlineInternalPlugin extends InternalPluginInjector {
  constructor(plugin: IconFolderPlugin) {
    super(plugin);
  }

  register(): void {
    if (!this.enabled) {
      logger.info(
        `Outline: Skipping internal plugin registration because it is not enabled.`,
      );
      return;
    }

    const treeItems = Array.from(
      this.leaf.tree.containerEl.querySelectorAll(`.${TREE_ITEM_CLASS}`),
    );
    for (const treeItem of treeItems) {
      const treeItemInner = treeItem.querySelector(`.${TREE_ITEM_INNER}`);
      const text = treeItemInner?.getText();
      if (!text) {
        continue;
      }

      const iconShortcodeRegex = createIconShortcodeRegex(this.plugin);
      const iconIdentifierLength =
        this.plugin.getSettings().iconIdentifier.length;

      for (const code of [...text.matchAll(iconShortcodeRegex)]
        .sort((a, b) => b.index - a.index)
        .map((arr) => ({ text: arr[0], index: arr.index! }))) {
        const shortcode = code.text;
        const iconName = shortcode.slice(
          iconIdentifierLength,
          shortcode.length - iconIdentifierLength,
        );
        const iconObject = icon.getIconByName(iconName);
        if (iconObject) {
          console.log(iconObject);
        }
      }
    }
  }

  get leaf(): OutlineView | undefined {
    const leaf = this.plugin.app.workspace.getLeavesOfType('outline');
    if (!leaf) {
      return undefined;
    }

    if (leaf.length === 0) {
      return undefined;
    }

    return leaf[0].view as OutlineView;
  }

  get outline() {
    return this.plugin.app.internalPlugins.getPluginById('outline');
  }

  get enabled(): boolean {
    return this.plugin.app.internalPlugins.getPluginById('outline').enabled;
  }
}
