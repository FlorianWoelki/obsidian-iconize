import emoji from '@app/emoji';
import svg from '@app/lib/util/svg';
import icon from '@app/lib/icon';
import { logger } from '@app/lib/logger';
import {
  calculateFontTextSize,
  calculateHeaderSize,
  HTMLHeader,
  isHeader,
} from '@app/lib/util/text';
import IconizePlugin from '@app/main';
import { MarkdownPostProcessorContext } from 'obsidian';

export const processIconInLinkMarkdown = (
  plugin: IconizePlugin,
  element: HTMLElement,
  ctx: MarkdownPostProcessorContext,
) => {
  const linkElements = element.querySelectorAll('a');
  if (!linkElements || linkElements.length === 0) {
    return;
  }

  linkElements.forEach((linkElement) => {
    // Skip if the link element e.g., is a tag.
    if (!linkElement.hasAttribute('data-href')) {
      return;
    }

    const linkHref = linkElement.getAttribute('href');
    if (!linkHref) {
      logger.warn('Link element does not have an `href` attribute');
      return;
    }

    const file = plugin.app.metadataCache.getFirstLinkpathDest(
      linkHref,
      ctx.sourcePath,
    );
    if (!file) {
      logger.warn('Link element does not have a linkpath to a file');
      return;
    }

    const path = file.path;
    const iconValue = icon.getIconByPath(plugin, path);
    if (!iconValue) {
      return;
    }

    let fontSize = calculateFontTextSize();
    const tagName = linkElement.parentElement?.tagName?.toLowerCase() ?? '';
    if (isHeader(tagName)) {
      fontSize = calculateHeaderSize(tagName as HTMLHeader);
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
        emoji.parseEmoji(plugin.getSettings().emojiStyle, iconName, fontSize) ??
        iconName;
      rootSpan.style.transform = 'translateY(0)';
      rootSpan.innerHTML = parsedEmoji;
    } else {
      let svgEl = icon.getIconByName(plugin, iconName).svgElement;
      svgEl = svg.setFontSize(svgEl, fontSize);
      if (svgEl) {
        rootSpan.style.transform = 'translateY(20%)';
        rootSpan.innerHTML = svgEl;
      }
    }

    linkElement.prepend(rootSpan);
  });
};
