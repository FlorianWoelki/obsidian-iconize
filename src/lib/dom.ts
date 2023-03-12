import twemoji from 'twemoji';
import { getSvgFromLoadedIcon, nextIdentifier } from '../iconPackManager';
import IconFolderPlugin from '../main';
import style from './style';
import svg from './svg';

/**
 * Removes the `obsidian-icon-folder-icon` icon node from the provided HTMLElement.
 * @param el HTMLElement from which the icon node will be removed.
 */
const removeIconInNode = (el: HTMLElement): void => {
  const iconNode = el.querySelector('.obsidian-icon-folder-icon');
  if (!iconNode) {
    return;
  }

  iconNode.remove();
};

/**
 * Removes the 'obsidian-icon-folder-icon' icon node from the HTMLElement corresponding
 * to the specified file path.
 * @param path File path for which the icon node will be removed.
 */
const removeIconInPath = (path: string): void => {
  const node = document.querySelector(`[data-path="${path}"]`) as HTMLElement | undefined;
  if (!node) {
    console.error('element with data path not found', path);
    return;
  }

  removeIconInNode(node);
};

/**
 * Adds an icon or emoji to an HTMLElement based on the specified icon name and color.
 * @param plugin Instance of the IconFolderPlugin.
 * @param iconName Name of the icon or emoji to add.
 * @param node HTMLElement to which the icon or emoji will be added.
 * @param color Optional color of the icon to add.
 */
const addIconToNode = (plugin: IconFolderPlugin, iconName: string, node: HTMLElement, color?: string): void => {
  // Gets the possible icon based on the icon name.
  const iconNextIdentifier = nextIdentifier(iconName);
  const possibleIcon = getSvgFromLoadedIcon(
    iconName.substring(0, iconNextIdentifier),
    iconName.substring(iconNextIdentifier),
  );

  if (possibleIcon) {
    // The icon is possibly not an emoji.
    let iconContent = style.applyAll(plugin, possibleIcon, node);
    if (color) {
      iconContent = svg.colorize(possibleIcon, color);
    }
    node.innerHTML = iconContent;
  } else {
    // The icon is an emoji.
    let emoji = '';
    switch (plugin.getSettings().emojiStyle) {
      case 'twemoji':
        emoji = twemoji.parse(iconName, {
          base: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/',
          folder: 'svg',
          ext: '.svg',
          attributes: () => ({
            width: '16px',
            height: '16px',
          }),
        }) as any;
        break;
      case 'native':
        emoji = iconName;
      default:
        break;
    }

    node.innerHTML = style.applyAll(plugin, emoji, node);
  }
};

export default {
  addIconToNode,
  removeIconInNode,
  removeIconInPath,
};
