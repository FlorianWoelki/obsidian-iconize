// This library file does not include any other dependency and is a standalone file that
// only include utility functions for setting styles for nodes or icons. The only
// dependency is the `svg` library.

import emoji from '../../emoji';
import IconFolderPlugin from '../../main';
import svg from './svg';

interface Margin {
  top: number;
  right: number;
  left: number;
  bottom: number;
}

/**
 * Sets the margin for a specific node.
 * @param el Node where the margin will be set.
 * @param margin Margin that will be applied to the node.
 * @returns The modified node with the applied margin.
 */
const setMargin = (el: HTMLElement, margin: Margin): HTMLElement => {
  el.style.margin = `${margin.top}px ${margin.right}px ${margin.bottom}px ${margin.left}px`;
  return el;
};

/**
 * Applies all stylings to the specified svg icon string and applies styling to the node
 * (container). The styling to the specified element is only modified when it is an emoji
 * or extra margin is defined in the settings.
 * @param plugin Instance of the IconFolderPlugin.
 * @param iconString SVG that will be used to apply the svg styles to.
 * @param el Node for manipulating the style.
 * @returns Icon svg string with the manipulate style attributes.
 */
const applyAll = (plugin: IconFolderPlugin, iconString: string, container: HTMLElement): string => {
  iconString = svg.setFontSize(iconString, plugin.getSettings().fontSize);
  iconString = svg.colorize(iconString, plugin.getSettings().iconColor);

  // Sets the margin of an element.
  const margin = plugin.getSettings().extraMargin;
  const normalizedMargin = {
    top: margin.top !== undefined ? margin.top : 4,
    right: margin.right !== undefined ? margin.right : 4,
    left: margin.left !== undefined ? margin.left : 4,
    bottom: margin.bottom !== undefined ? margin.bottom : 4,
  };
  if (plugin.getSettings().extraMargin) {
    setMargin(container, normalizedMargin);
  }

  if (emoji.isEmoji(iconString)) {
    container.style.fontSize = `${plugin.getSettings().fontSize}px`;
    container.style.lineHeight = `${plugin.getSettings().fontSize}px`;
  }

  return iconString;
};

/**
 * Refreshes all the styles of all the applied icons where a `.obsidian-icon-folder-icon`
 * class is defined. This function only modifies the styling of the node.
 * @param plugin Instance of the IconFolderPlugin.
 */
const refreshAllIcons = (plugin: IconFolderPlugin): void => {
  const fileExplorers = plugin.app.workspace.getLeavesOfType('file-explorer');
  for (const fileExplorer of fileExplorers) {
    Object.keys(plugin.getData()).forEach((path) => {
      const fileItem = fileExplorer.view.fileItems[path];
      if (fileItem) {
        const titleEl = fileItem.titleEl;
        const iconNode = titleEl.querySelector('.obsidian-icon-folder-icon') as HTMLElement;
        iconNode.innerHTML = applyAll(plugin, iconNode.innerHTML, iconNode);
      }
    });
  }
};

export default {
  applyAll,
  setMargin,
  refreshAllIcons,
};
