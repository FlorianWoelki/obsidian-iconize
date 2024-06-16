import InternalPluginInjector from '@app/@types/internal-plugin-injector';
import { createIconShortcodeRegex } from '@app/editor/markdown-processors';
import svg from '@app/lib/util/svg';
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

    const updateTreeItems = () => {
      const treeItems = Array.from(
        this.leaf.tree.containerEl.querySelectorAll(`.${TREE_ITEM_CLASS}`),
      );
      for (const treeItem of treeItems) {
        const treeItemInner = treeItem.querySelector(`.${TREE_ITEM_INNER}`);
        let text = treeItemInner?.getText();
        if (!text) {
          continue;
        }

        const iconShortcodeRegex = createIconShortcodeRegex(this.plugin);
        const iconIdentifierLength =
          this.plugin.getSettings().iconIdentifier.length;

        let trimmedLength = 0;
        for (const code of [...text.matchAll(iconShortcodeRegex)]
          .sort((a, b) => a.index - b.index)
          .map((arr) => ({ text: arr[0], index: arr.index! }))) {
          const shortcode = code.text;
          const iconName = shortcode.slice(
            iconIdentifierLength,
            shortcode.length - iconIdentifierLength,
          );
          const iconObject = icon.getIconByName(iconName);
          if (iconObject) {
            const startIndex = code.index - trimmedLength;
            const endIndex = code.index + code.text.length - trimmedLength;

            const str =
              text.substring(0, startIndex) + text.substring(endIndex);

            const iconSpan = createSpan({
              cls: 'cm-iconize-icon',
              attr: {
                'aria-label': iconName,
                'data-icon': iconName,
                'aria-hidden': 'true',
              },
            });
            const fontSize = parseFloat(
              getComputedStyle(document.body).getPropertyValue(
                '--nav-item-size',
              ) ?? '16',
            );
            const svgElement = svg.setFontSize(iconObject.svgElement, fontSize);
            iconSpan.style.display = 'inline-flex';
            iconSpan.style.transform = 'translateY(13%)';
            iconSpan.innerHTML = svgElement;
            treeItemInner.innerHTML = treeItemInner.innerHTML.replace(
              shortcode,
              iconSpan.outerHTML,
            );

            text = str;
            trimmedLength += code.text.length;
          }
        }
      }
    };

    this.plugin.getEventEmitter().once('allIconsLoaded', () => {
      updateTreeItems();
    });
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
