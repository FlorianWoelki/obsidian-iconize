import svg from '@app/lib/util/svg';
import icon from '@app/lib/icon';
import {
  Header,
  calculateFontTextSize,
  calculateHeaderSize,
  isHeader,
} from '@app/lib/util/text';
import IconFolderPlugin from '@app/main';

export const processMarkdown = (
  plugin: IconFolderPlugin,
  element: HTMLElement,
) => {
  // Ignore if codeblock
  const codeElement = element.querySelector('pre > code');
  if (codeElement) {
    return;
  }

  const regex = new RegExp(
    `(${
      plugin.getSettings().iconIdentifier
    })((\\w{1,64}:\\d{17,18})|(\\w{1,64}))(${
      plugin.getSettings().iconIdentifier
    })`,
    'g',
  );
  const iconShortcodes = Array.from(element.innerHTML.matchAll(regex));
  const iconIdentifierLength = plugin.getSettings().iconIdentifier.length;

  for (let index = 0; index < iconShortcodes.length; index++) {
    const shortcode = iconShortcodes[index][0];
    const iconName = shortcode.slice(
      iconIdentifierLength,
      shortcode.length - iconIdentifierLength,
    );

    // Find icon and process it if exists
    const iconObject = icon.getIconByName(iconName);
    const firstElementChild = element.firstElementChild ?? element;
    if (iconObject) {
      const rootSpan = createSpan({
        cls: 'cm-iconize-icon',
        attr: {
          'aria-label': iconName,
          'data-icon': iconName,
          'aria-hidden': 'true',
        },
      });
      rootSpan.style.display = 'inline-flex';
      rootSpan.style.transform = 'translateY(13%)';

      const tagName = firstElementChild.tagName.toLowerCase();
      let fontSize = calculateFontTextSize();

      if (isHeader(tagName)) {
        fontSize = calculateHeaderSize(tagName as Header);
        const svgElement = svg.setFontSize(iconObject.svgElement, fontSize);
        rootSpan.innerHTML = svgElement;

        // Replace first element (DIV html content) with svg element
        firstElementChild.innerHTML = firstElementChild.innerHTML.replace(
          shortcode,
          rootSpan.outerHTML,
        );
      } else {
        const svgElement = svg.setFontSize(iconObject.svgElement, fontSize);
        rootSpan.innerHTML = svgElement;

        // Replace shortcode by svg element
        firstElementChild.innerHTML = firstElementChild.innerHTML.replace(
          shortcode,
          rootSpan.outerHTML,
        );
      }
    }
  }
};
