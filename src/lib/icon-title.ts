import config from '../config';
import svg from './util/svg';

const getTitleIcon = (leaf: HTMLElement): HTMLElement | null => {
  return leaf.querySelector(`.${config.TITLE_ICON_CLASS}`);
};

interface AddOptions {
  fontSize?: number;
}

const add = (
  inlineTitleEl: HTMLElement,
  svgElement: string,
  options?: AddOptions,
): void => {
  if (options?.fontSize) {
    svgElement = svg.setFontSize(svgElement, options.fontSize);
  }

  let titleIcon = getTitleIcon(inlineTitleEl.parentElement);
  const hadTitleIcon = titleIcon !== null;
  if (!titleIcon) {
    titleIcon = document.createElement('div');
  }

  titleIcon.style.display = 'block';
  titleIcon.classList.add(config.TITLE_ICON_CLASS);
  titleIcon.innerHTML = svgElement;
  if (!hadTitleIcon) {
    inlineTitleEl.parentElement.prepend(titleIcon);
  }
};

/**
 * Removes the title icon from the provided HTMLElement. In this context, removing means
 * setting the `display` style to `none`.
 * @param contentEl HTMLElement to remove the title icon from.
 */
const remove = (inlineTitleEl: HTMLElement): void => {
  if (!inlineTitleEl.parentElement) {
    return;
  }

  const titleIconContainer = getTitleIcon(inlineTitleEl.parentElement);
  if (!titleIconContainer) {
    return;
  }

  titleIconContainer.style.display = 'none';
};

export default {
  add,
  remove,
};
