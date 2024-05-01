import IconFolderPlugin from '@app/main';
import config from '@app/config';
import emoji from '@app/emoji';
import svg from './util/svg';
import { IconInTitlePosition } from '@app/settings/data';

const getTitleIcon = (leaf: HTMLElement): HTMLElement | null => {
  return leaf.querySelector(`.${config.TITLE_ICON_CLASS}`);
};

interface Options {
  fontSize?: number;
}

const add = (
  plugin: IconFolderPlugin,
  inlineTitleEl: HTMLElement,
  svgElement: string,
  options?: Options,
): void => {
  if (!inlineTitleEl.parentElement) {
    return;
  }

  if (options?.fontSize) {
    svgElement = svg.setFontSize(svgElement, options.fontSize);
  }

  let titleIcon = getTitleIcon(inlineTitleEl.parentElement);
  const hadTitleIcon = titleIcon !== null;
  if (!titleIcon) {
    titleIcon = document.createElement('div');
  }

  titleIcon.style.removeProperty('display');
  titleIcon.classList.add(config.TITLE_ICON_CLASS);
  // Checks if the passed element is an emoji.
  if (emoji.isEmoji(svgElement) && options.fontSize) {
    svgElement =
      emoji.parseEmoji(
        plugin.getSettings().emojiStyle,
        svgElement,
        options.fontSize,
      ) ?? svgElement;
    titleIcon.style.fontSize = `${options.fontSize}px`;
  }
  titleIcon.innerHTML = svgElement;
  if (!hadTitleIcon) {
    if (
      plugin.getSettings().iconInTitlePosition === IconInTitlePosition.Above
    ) {
      inlineTitleEl.parentElement.prepend(titleIcon);
    } else if (
      plugin.getSettings().iconInTitlePosition === IconInTitlePosition.Inline
    ) {
      inlineTitleEl.prepend(titleIcon);
    }
  }
};

const updateStyle = (inlineTitleEl: HTMLElement, options: Options): void => {
  if (!inlineTitleEl.parentElement) {
    return;
  }

  const titleIcon = getTitleIcon(inlineTitleEl.parentElement);
  if (!titleIcon) {
    return;
  }

  if (options.fontSize) {
    if (!emoji.isEmoji(titleIcon.innerHTML)) {
      titleIcon.innerHTML = svg.setFontSize(
        titleIcon.innerHTML,
        options.fontSize,
      );
    } else {
      titleIcon.style.fontSize = `${options.fontSize}px`;
    }
  }
};

/**
 * Hides the title icon from the provided HTMLElement.
 * @param contentEl HTMLElement to hide the title icon from.
 */
const hide = (inlineTitleEl: HTMLElement): void => {
  if (!inlineTitleEl.parentElement) {
    return;
  }

  const titleIconContainer = getTitleIcon(inlineTitleEl.parentElement);
  if (!titleIconContainer) {
    return;
  }

  titleIconContainer.style.display = 'none';
};

const remove = (inlineTitleEl: HTMLElement): void => {
  if (!inlineTitleEl.parentElement) {
    return;
  }

  const titleIconContainer = getTitleIcon(inlineTitleEl.parentElement);
  if (!titleIconContainer) {
    return;
  }

  titleIconContainer.remove();
};

export default {
  add,
  updateStyle,
  hide,
  remove,
};
