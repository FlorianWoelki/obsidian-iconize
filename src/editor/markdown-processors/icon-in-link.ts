import emoji from '@app/emoji';
import icon from '@app/lib/icon';
import { logger } from '@app/lib/logger';
import IconFolderPlugin from '@app/main';
import { MarkdownPostProcessorContext } from 'obsidian';

export const processIconInLinkMarkdown = (
  plugin: IconFolderPlugin,
  element: HTMLElement,
  ctx: MarkdownPostProcessorContext,
) => {
  const linkElement = element.querySelector('a') as
    | HTMLAnchorElement
    | undefined;
  if (!linkElement) {
    return;
  }

  const linkHref = linkElement.getAttribute('href');
  if (!linkHref) {
    logger.warn('Link element does not have an `href` attribute.');
    return;
  }

  const file = plugin.app.metadataCache.getFirstLinkpathDest(
    linkHref,
    ctx.sourcePath,
  );
  if (!file) {
    logger.warn('Link element does not have a linkpath to a file.');
    return;
  }

  const path = file.path;
  const iconValue = icon.getIconByPath(plugin, path);
  if (!iconValue) {
    return;
  }

  const iconName =
    typeof iconValue === 'string'
      ? iconValue
      : iconValue.prefix + iconValue.name;

  const rootSpan = createSpan({
    cls: 'iconize-icon-in-link',
    attr: {
      title: iconName,
      'aria-label': iconName,
      'data-icon': iconName,
      'aria-hidden': 'true',
    },
  });
  rootSpan.style.color =
    plugin.getIconColor(path) ?? plugin.getSettings().iconColor;

  if (emoji.isEmoji(iconName)) {
    const parsedEmoji =
      emoji.parseEmoji(plugin.getSettings().emojiStyle, iconName) ?? iconName;
    rootSpan.innerHTML = parsedEmoji;
  } else {
    const svg = icon.getIconByName(iconName).svgElement;
    if (svg) {
      rootSpan.innerHTML = svg;
    }
  }

  linkElement.prepend(rootSpan);
};
