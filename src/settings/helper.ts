import customRule from '@lib/custom-rule';
import style from '@lib/util/style';
import IconizePlugin from '@app/main';
import { getFileItemTitleEl } from '@app/util';
import svg from '@app/lib/util/svg';

/**
 * Helper function that refreshes the style of all the icons that are defined
 * or in a custom rule involved.
 * @param plugin Instance of the IconizePlugin.
 */
const refreshStyleOfIcons = async (plugin: IconizePlugin): Promise<void> => {
  // Refreshes the icon style for all normally added icons.
  style.refreshIconNodes(plugin);

  // Refreshes the icon style for all custom icon rules, when the color of the rule is
  // not defined.
  for (const rule of customRule.getSortedRules(plugin)) {
    const fileItems = await customRule.getFileItems(plugin, rule);
    for (const fileItem of fileItems) {
      const titleEl = getFileItemTitleEl(fileItem);
      const iconNode = titleEl.querySelector('.iconize-icon') as HTMLElement;
      let iconContent = iconNode.innerHTML;

      iconContent = style.applyAll(plugin, iconContent, iconNode);

      if (rule.color) {
        iconContent = svg.colorize(iconContent, rule.color);
        iconNode.style.color = rule.color;
      }

      iconNode.innerHTML = iconContent;
    }
  }
};

export default {
  refreshStyleOfIcons,
};
