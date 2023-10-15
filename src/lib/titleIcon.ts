import config from '../config';
import svg from './util/svg';

const getTitleIconContainer = (leaf: HTMLElement): HTMLElement | null => {
  return leaf.querySelector(`.${config.TITLE_ICON_CONTAINER_CLASS}`);
};

interface AddOptions {
  fontSize?: number;
}

const add = (
  contentEl: HTMLElement,
  svgElement: string,
  options?: AddOptions,
): void => {
  if (options?.fontSize) {
    svgElement = svg.setFontSize(svgElement, options.fontSize);
  }

  let titleIconContainer = getTitleIconContainer(contentEl.parentElement);
  let titleIcon = titleIconContainer?.children[0];
  const hadTitleIconContainer = titleIconContainer !== null;
  if (!titleIconContainer) {
    titleIconContainer = document.createElement('div');
    titleIcon = document.createElement('div');
  }

  titleIconContainer.style.display = 'block';
  titleIconContainer.classList.add(config.TITLE_ICON_CONTAINER_CLASS);
  titleIcon.classList.add(config.TITLE_ICON_CLASS);
  titleIcon.innerHTML = svgElement;
  if (!hadTitleIconContainer) {
    titleIconContainer.appendChild(titleIcon);
    contentEl.prepend(titleIconContainer);
  }
};

/**
 * Removes the title icon from the provided HTMLElement. In this context, removing means
 * setting the `display` style to `none`.
 * @param contentEl HTMLElement to remove the title icon from.
 */
const remove = (contentEl: HTMLElement): void => {
  if (!contentEl.parentElement) {
    return;
  }

  const titleIconContainer = getTitleIconContainer(contentEl.parentElement);
  if (!titleIconContainer) {
    return;
  }

  titleIconContainer.style.display = 'none';
};

export default {
  add,
  remove,
};
