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
    titleIconContainer = contentEl.createDiv();
    titleIcon = titleIconContainer.createDiv();
  }

  titleIconContainer.style.display = 'block';
  titleIconContainer.addClass(config.TITLE_ICON_CONTAINER_CLASS);
  titleIcon.addClass(config.TITLE_ICON_CLASS);
  titleIcon.innerHTML = svgElement;
  if (!hadTitleIconContainer) {
    titleIconContainer.appendChild(titleIcon);
    contentEl.prepend(titleIconContainer);
  }
};

const remove = (contentEl: HTMLElement): void => {
  if (!contentEl.parentElement) {
    return;
  }

  const titleIcon = getTitleIconContainer(contentEl.parentElement);
  if (!titleIcon) {
    return;
  }

  titleIcon.style.display = 'none';
};

export default {
  add,
  remove,
};
