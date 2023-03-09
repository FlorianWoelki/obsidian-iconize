import { TFile } from 'obsidian';
import { getSvgFromLoadedIcon, nextIdentifier } from '../iconPackManager';
import IconFolderPlugin from '../main';

/**
 * Gets the icon container inside of a tab. The icon container mostly relies next to the
 * element with the actual name of the file.
 * @param filename String that will be used to get the icon container.
 * @returns HTMLElement when the icon container was found or undefined when not.
 */
const getIconContainer = (filename: string): HTMLElement | undefined => {
  // Checks if tab header element exists with the `aria-label` attribute.
  const node = document.querySelector(`[aria-label="${filename}"]`);
  if (!node || !node.hasAttribute('draggable') || node.children.length === 0) {
    return undefined;
  }

  // Gets the inner header container of the tab.
  const headerInnerContainer = node.children[0];
  if (!headerInnerContainer || headerInnerContainer.children.length === 0) {
    return undefined;
  }

  // Gets the icon container inside of the inner header container.
  const iconContainer = headerInnerContainer.children[0] as HTMLElement | undefined;
  if (!iconContainer) {
    return undefined;
  }

  return iconContainer;
};

const add = (plugin: IconFolderPlugin, file: TFile) => {
  const iconContainer = getIconContainer(file.basename);
  if (!iconContainer) {
    return;
  }

  // Removes the `display: none` from the obsidian styling.
  iconContainer.style.display = 'flex';

  const data = Object.entries(plugin.getData());
  const iconData = data.find(([dataPath]) => dataPath === file.path);
  // Check if data was not found or name of icon is not a string.
  if (!iconData || typeof iconData[1] !== 'string') {
    const defaultIcon =
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-file"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>';
    iconContainer.innerHTML = defaultIcon;
    return;
  }

  // Adds the icon to the open tab.
  const [_, iconName] = iconData;
  const iconNextIdentifier = nextIdentifier(iconName);
  iconContainer.innerHTML = getSvgFromLoadedIcon(
    iconName.substring(0, iconNextIdentifier),
    iconName.substring(iconNextIdentifier),
  );
};

const update = (file: TFile) => {};

const remove = (file: TFile) => {
  const iconContainer = getIconContainer(file.basename);
  if (!iconContainer) {
    return;
  }

  // Removes the `display: none` from the obsidian styling.
  iconContainer.style.display = 'none';
};

export default {
  add,
  update,
  remove,
};
