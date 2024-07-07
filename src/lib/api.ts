import IconizePlugin from '@app/main';
import dom from '@lib/util/dom';
import svg from '@lib/util/svg';
import icon from '@lib/icon';
import { EventEmitter } from './event/event';
import { removeIconFromIconPack, saveIconToIconPack } from '@app/util';
import { getAllIconPacks, getIconsFromIconPack } from '@app/icon-pack-manager';

export { AllIconsLoadedEvent } from '@lib/event/events';

export default interface IconizeAPI {
  getEventEmitter(): EventEmitter;
  getIconByName: typeof icon.getIconByName;
  /**
   * Sets an icon or emoji for an HTMLElement based on the specified icon name and color.
   * The function manipulates the specified node inline.
   * @param iconName Name of the icon or emoji to add.
   * @param node HTMLElement to which the icon or emoji will be added.
   * @param color Optional color of the icon to add.
   */
  setIconForNode(iconName: string, node: HTMLElement, color?: string): void;
  doesElementHasIconNode: typeof dom.doesElementHasIconNode;
  getIconFromElement: typeof dom.getIconFromElement;
  removeIconInNode: typeof dom.removeIconInNode;
  removeIconInPath: typeof dom.removeIconInPath;
  /**
   * Will add the icon to the icon pack and then extract the icon to the icon pack.
   * @param iconNameWithPrefix String that will be used to add the icon to the icon pack.
   */
  saveIconToIconPack(iconNameWithPrefix: string): void;
  /**
   * Will remove the icon from the icon pack by removing the icon file from the icon pack directory.
   * @param iconNameWithPrefix String that will be used to remove the icon from the icon pack.
   */
  removeIconFromIconPack(iconNameWithPrefix: string): void;
  getAllIconPacks: typeof getAllIconPacks;
  getIconsFromIconPack: typeof getIconsFromIconPack;
  util: {
    dom: typeof dom;
    svg: typeof svg;
  };
  version: {
    current: string;
  };
}

export function getApi(plugin: IconizePlugin): IconizeAPI {
  return {
    getEventEmitter: () => plugin.getEventEmitter(),
    getIconByName: (iconNameWithPrefix: string) =>
      icon.getIconByName(iconNameWithPrefix),
    setIconForNode: (iconName: string, node: HTMLElement, color?: string) =>
      dom.setIconForNode(plugin, iconName, node, color),
    saveIconToIconPack: (iconNameWithPrefix) =>
      saveIconToIconPack(plugin, iconNameWithPrefix),
    removeIconFromIconPack: (iconNameWithPrefix) =>
      removeIconFromIconPack(plugin, iconNameWithPrefix),
    getIconsFromIconPack: getIconsFromIconPack,
    getAllIconPacks: getAllIconPacks,
    doesElementHasIconNode: dom.doesElementHasIconNode,
    getIconFromElement: dom.getIconFromElement,
    removeIconInNode: dom.removeIconInNode,
    removeIconInPath: dom.removeIconInPath,
    util: {
      dom,
      svg,
    },
    version: {
      get current() {
        return plugin.manifest.version;
      },
    },
  };
}
