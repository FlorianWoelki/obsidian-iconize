import InternalPluginInjector from '@app/@types/internal-plugin-injector';
import { createIconShortcodeRegex } from '@app/editor/markdown-processors';
import svg from '@app/lib/util/svg';
import icon from '@app/lib/icon';
import { LoggerPrefix, logger } from '@app/lib/logger';
import IconizePlugin from '@app/main';
import { requireApiVersion, View, WorkspaceLeaf } from 'obsidian';

const TREE_ITEM_CLASS = 'tree-item-self';
const TREE_ITEM_INNER = 'tree-item-inner';

interface OutlineLeaf extends WorkspaceLeaf {
  view: OutlineView;
}

interface OutlineView extends View {
  tree: {
    containerEl: HTMLDivElement;
  };
}

export default class OutlineInternalPlugin extends InternalPluginInjector {
  constructor(plugin: IconizePlugin) {
    super(plugin);
  }

  onMount(): void {
    // TODO: Might improve the performance here.
  }

  register(): void {
    if (!this.enabled) {
      logger.info(
        'Skipping internal plugin registration because it is not enabled.',
        LoggerPrefix.Outline,
      );
      return;
    }

    const updateTreeItems = () => {
      if (!this.leaf?.view?.tree) {
        return;
      }

      const treeItems = Array.from(
        this.leaf.view.tree.containerEl.querySelectorAll(`.${TREE_ITEM_CLASS}`),
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

    const setOutlineIcons = () => {
      this.plugin.getEventEmitter().once('allIconsLoaded', () => {
        updateTreeItems();

        const callback = (mutations: MutationRecord[]) => {
          mutations.forEach((mutation) => {
            if (mutation.type !== 'childList') {
              return;
            }

            const addedNodes = mutation.addedNodes;
            if (addedNodes.length === 0) {
              return;
            }

            updateTreeItems();
          });

          if (!this.enabled) {
            observer.disconnect();
          }
        };

        const observer = new MutationObserver(callback);

        observer.observe(this.leaf.view.tree.containerEl, {
          childList: true,
          subtree: true,
        });
      });
    };

    if (requireApiVersion('1.7.2')) {
      // TODO: Might improve the performance here.
      this.leaf.loadIfDeferred().then(setOutlineIcons);
    } else {
      setOutlineIcons();
    }
  }

  get leaf(): OutlineLeaf | undefined {
    const leaf = this.plugin.app.workspace.getLeavesOfType('outline');
    if (!leaf) {
      logger.log('`leaf` in outline is undefined', LoggerPrefix.Outline);
      return undefined;
    }

    if (leaf.length === 0) {
      logger.log('`leaf` length in outline is 0', LoggerPrefix.Outline);
      return undefined;
    }

    return leaf[0] as OutlineLeaf;
  }

  get outline() {
    return this.plugin.app.internalPlugins.getPluginById('outline');
  }

  get enabled(): boolean {
    return this.plugin.app.internalPlugins.getPluginById('outline').enabled;
  }
}
