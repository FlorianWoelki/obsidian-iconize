import emoji from '../emoji';
import IconFolderPlugin from '../main';
import svg from './svg';

interface Margin {
  top: number;
  right: number;
  left: number;
  bottom: number;
}

const setMargin = (el: HTMLElement, margin: Margin): HTMLElement => {
  el.style.margin = `${margin.top}px ${margin.right}px ${margin.bottom}px ${margin.left}px`;
  return el;
};

const applyAll = (plugin: IconFolderPlugin, iconString: string, el: HTMLElement): string => {
  iconString = svg.setFontSize(iconString, plugin.getSettings().fontSize);
  iconString = svg.colorize(iconString, plugin.getSettings().iconColor);

  // Sets the margin of an element.
  const margin = plugin.getSettings().extraMargin;
  const normalizedMargin = {
    top: margin.top !== undefined ? margin.top : 4,
    right: margin.right !== undefined ? margin.right : 4,
    left: margin.left !== undefined ? margin.left : 4,
    bottom: margin.bottom !== undefined ? margin.bottom : 4,
  };
  if (plugin.getSettings().extraMargin) {
    setMargin(el, normalizedMargin);
  }

  if (emoji.isEmoji(iconString)) {
    el.style.fontSize = `${plugin.getSettings().fontSize}px`;
    el.style.lineHeight = `${plugin.getSettings().fontSize}px`;
  }

  return iconString;
};

export default {
  applyAll,
  setMargin,
};
