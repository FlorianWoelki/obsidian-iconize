import customRule from '@lib/customRule';
import inheritance from '@lib/inheritance';
import style from '@lib/util/style';
import dom from '@lib/util/dom';
import IconFolderPlugin from '@app/main';

/**
 * Helper function that refreshes the style of all the icons that are defined, in some
 * sort of inheritance, or in a custom rule involved.
 * @param plugin Instance of the IconFolderPlugin.
 */
const refreshStyleOfIcons = (plugin: IconFolderPlugin): void => {
  // Refreshes the icon style for all normally added icons.
  style.refreshIconNodes(plugin);

  const fileExplorers = plugin.app.workspace.getLeavesOfType('file-explorer');
  for (const fileExplorer of fileExplorers) {
    // Refreshes the icon style for all inheritance folders.
    for (const folderPath of Object.keys(inheritance.getFolders(plugin))) {
      // Apply style for the icon node itself.
      const folderItem = fileExplorer.view.fileItems[folderPath];
      if (folderItem) {
        const titleEl = dom.getFileItemTitleEl(folderItem);
        const iconNode = titleEl.querySelector('.obsidian-icon-folder-icon') as HTMLElement;
        iconNode.innerHTML = style.applyAll(plugin, iconNode.innerHTML, iconNode);
      }

      // Apply style for all files in this inheritance.
      const files = inheritance.getFiles(plugin, folderPath);
      for (const file of files) {
        const fileItem = fileExplorer.view.fileItems[file.path];
        const titleEl = dom.getFileItemTitleEl(fileItem);
        const iconNode = titleEl.querySelector('.obsidian-icon-folder-icon') as HTMLElement;
        iconNode.innerHTML = style.applyAll(plugin, iconNode.innerHTML, iconNode);
      }
    }

    // Refreshes the icon style for all custom icon rules, when the color of the rule is
    // not defined.
    for (const rule of customRule.getSortedRules(plugin)) {
      const files = customRule.getFiles(plugin, rule);
      for (const file of files) {
        if (rule.color) {
          continue;
        }

        const fileItem = fileExplorer.view.fileItems[file.path];
        const titleEl = dom.getFileItemTitleEl(fileItem);
        const iconNode = titleEl.querySelector('.obsidian-icon-folder-icon') as HTMLElement;
        iconNode.innerHTML = style.applyAll(plugin, iconNode.innerHTML, iconNode);
      }
    }
  }
};

export default {
  refreshStyleOfIcons,
};
