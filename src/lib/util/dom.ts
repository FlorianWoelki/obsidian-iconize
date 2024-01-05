import config from '@app/config';
import { getSvgFromLoadedIcon, nextIdentifier } from '../../icon-pack-manager';
import IconFolderPlugin from '../../main';
import style from './style';
import svg from './svg';
import emoji from '@app/emoji';

/**
 * Removes the `iconize-icon` icon node from the provided HTMLElement.
 * @param el HTMLElement from which the icon node will be removed.
 */
const removeIconInNode = (el: HTMLElement): void => {
  const iconNode = el.querySelector('.iconize-icon');
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
 * Removes the 'iconize-icon' icon node from the HTMLElement corresponding
 * to the specified file path.
 * @param path File path for which the icon node will be removed.
 */
const removeIconInPath = (path: string, options?: RemoveOptions): void => {
  const node =
    options?.container ?? document.querySelector(`[data-path="${path}"]`);
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
const setIconForNode = (
  plugin: IconFolderPlugin,
  iconName: string,
  node: HTMLElement,
  color?: string,
): void => {
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
      iconContent = svg.colorize(iconContent, color);
    }
    node.innerHTML = iconContent;
  } else {
    const parsedEmoji =
      emoji.parseEmoji(plugin.getSettings().emojiStyle, iconName) ?? iconName;
    node.innerHTML = style.applyAll(plugin, parsedEmoji, node);
  }

  node.setAttribute('title', iconName);
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
const createIconNode = (
  plugin: IconFolderPlugin,
  path: string,
  iconName: string,
  options?: CreateOptions,
): void => {
  // Get the container from the provided options or try to find the node that has the
  // path from the document itself.
  const node =
    options?.container ?? document.querySelector(`[data-path="${path}"]`);
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

  let iconNode: HTMLDivElement = node.querySelector('.iconize-icon');
  // If the icon is already set in the path, we do not need to create a new div element.
  if (iconNode) {
    setIconForNode(plugin, iconName, iconNode, options?.color);
  } else {
    // Creates a new icon node and inserts it to the DOM.
    iconNode = document.createElement('div');
    iconNode.setAttribute(config.ICON_ATTRIBUTE_NAME, iconName);
    iconNode.classList.add('iconize-icon');

    setIconForNode(plugin, iconName, iconNode, options?.color);

    node.insertBefore(iconNode, titleNode);
  }
};

/**
 * Checks if the element has an icon node by checking if the element has a child with the
 * class `iconize-icon`.
 * @param element HTMLElement which will be checked if it has an icon.
 * @returns Boolean whether the element has an icon node or not.
 */
const doesElementHasIconNode = (element: HTMLElement): boolean => {
  return element.querySelector('.iconize-icon') !== null;
};

/**
 * Gets the icon name of the element if it has an icon node.
 * @param element HTMLElement parent which includes a node with the icon.
 * @returns String with the icon name if the element has an icon, `undefined` otherwise.
 */
const getIconFromElement = (element: HTMLElement): string | undefined => {
  const iconNode = element.querySelector('.iconize-icon');
  const existingIcon = iconNode?.getAttribute(config.ICON_ATTRIBUTE_NAME);
  return existingIcon;
};

export default {
  setIconForNode,
  createIconNode,
  doesElementHasIconNode,
  getIconFromElement,
  removeIconInNode,
  removeIconInPath,
};
