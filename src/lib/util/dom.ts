import { FileItem } from '@app/@types/obsidian';
import twemoji from 'twemoji';
import { getSvgFromLoadedIcon, nextIdentifier } from '../../iconPackManager';
import IconFolderPlugin from '../../main';
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

interface RemoveOptions {
  /**
   * The container that will be used to remove the icon. If not defined, it will try to
   * find the path within the `document`.
   */
  container?: HTMLElement;
}

/**
 * Removes the 'obsidian-icon-folder-icon' icon node from the HTMLElement corresponding
 * to the specified file path.
 * @param path File path for which the icon node will be removed.
 */
const removeIconInPath = (path: string, options?: RemoveOptions): void => {
  const node = options?.container ?? document.querySelector(`[data-path="${path}"]`);
  if (!node) {
    console.error('element with data path not found', path);
    return;
  }

  removeIconInNode(node);
};

/**
 * Sets an icon or emoji for an HTMLElement based on the specified icon name and color.
 * The function manipulates the specified node inline.
 * @param plugin Instance of the IconFolderPlugin.
 * @param iconName Name of the icon or emoji to add.
 * @param node HTMLElement to which the icon or emoji will be added.
 * @param color Optional color of the icon to add.
 */
const setIconForNode = (plugin: IconFolderPlugin, iconName: string, node: HTMLElement, color?: string): void => {
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
      node.style.color = color;
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

interface CreateOptions {
  /**
   * The container that will be used to insert the icon. If not defined, it will try to
   * find the path within the `document`.
   */
  container?: HTMLElement;
  /**
   * The color that will be applied to the icon.
   */
  color?: string;
}

/**
 * Creates an icon node for the specified path and inserts it to the DOM.
 * @param plugin Instance of the IconFolderPlugin.
 * @param path Path for which the icon node will be created.
 * @param iconName Name of the icon or emoji to add.
 * @param color Optional color of the icon to add.
 */
const createIconNode = (plugin: IconFolderPlugin, path: string, iconName: string, options?: CreateOptions): void => {
  // TODO: Refactor to more efficient solution.
  if (plugin.getData()[path]) {
    removeIconInPath(path, { container: options?.container });
  }

  // Get the container from the provided options or try to find the node that has the
  // path from the document itself.
  const node = options?.container ?? document.querySelector(`[data-path="${path}"]`);
  if (!node) {
    console.error('element with data path not found', path);
    return;
  }

  // Get the folder or file title node.
  let titleNode = node.querySelector('.nav-folder-title-content');
  if (!titleNode) {
    titleNode = node.querySelector('.nav-file-title-content');

    if (!titleNode) {
      console.error('element with title not found');
      return;
    }
  }

  // Check for possible inheritance and remove the inherited icon node.
  const possibleInheritanceIcon = node.querySelector('.obsidian-icon-folder-icon');
  if (possibleInheritanceIcon) {
    possibleInheritanceIcon.remove();
  }

  // Creates a new icon node and inserts it to the DOM.
  const iconNode = document.createElement('div');
  iconNode.classList.add('obsidian-icon-folder-icon');

  setIconForNode(plugin, iconName, iconNode, options?.color);

  node.insertBefore(iconNode, titleNode);
};

export default {
  setIconForNode,
  createIconNode,
  removeIconInNode,
  removeIconInPath,
};
