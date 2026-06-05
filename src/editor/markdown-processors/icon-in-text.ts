// TODO: Optimize the code to reduce the number of iterations and improve the
// performance.

import svg from '@app/lib/util/svg';
import icon from '@app/lib/icon';
import {
  HTMLHeader,
  calculateFontTextSize,
  calculateHeaderSize,
  isHeader,
} from '@app/lib/util/text';
import IconizePlugin from '@app/main';
import emoji from '@app/emoji';

export const createIconShortcodeRegex = (plugin: IconizePlugin): RegExp => {
  return new RegExp(
    `(${
      plugin.getSettings().iconIdentifier
    })((\\w{1,64}:\\d{17,18})|(\\w{1,64}))(${
      plugin.getSettings().iconIdentifier
    })`,
    'g',
  );
};

const createTreeWalker = (
  plugin: IconizePlugin,
  root: HTMLElement,
): TreeWalker => {
  return document.createTreeWalker(root, NodeFilter.SHOW_ALL, {
    acceptNode: function (node) {
      if (node.nodeName === 'CODE') {
        return NodeFilter.FILTER_REJECT;
      } else if (node.nodeName === '#text') {
        if (
          node.nodeValue &&
          (emoji.getRegex().test(node.nodeValue) ||
            createIconShortcodeRegex(plugin).test(node.nodeValue))
        ) {
          return NodeFilter.FILTER_ACCEPT;
        } else {
          return NodeFilter.FILTER_REJECT;
        }
      }
      return NodeFilter.FILTER_SKIP;
    },
  });
};

const findTextNodesRecursively = (
  node: Node,
  match: RegExp,
  results: Text[] = []
): Text[] => {
  if (node.nodeType === Node.TEXT_NODE) {
    const textNode = node as Text;
    if (textNode.textContent && match.test(textNode.textContent)) {
      results.push(textNode);
    }
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element;
    if (element.tagName === 'CODE') {
      return results;
    }
    for (const child of Array.from(element.childNodes)) {
      findTextNodesRecursively(child, match, results);
    }
  }
  return results;
};

const checkForTextNodes = (
  treeWalker: TreeWalker,
  match: RegExp,
  cb: (text: Text, code: { text: string; index: number }) => void,
): void => {
  const root = treeWalker.root as HTMLElement;
  const textNodesWithMatches = findTextNodesRecursively(root, match);

  textNodesWithMatches.forEach((textNode) => {
    if (!textNode.parentElement || !textNode.textContent) {
      return;
    }

    const textNodes = [...Array.from(textNode.parentElement.childNodes)].filter(
      (n): n is Text => n instanceof Text,
    );

    for (const text of textNodes) {
      if (!text.textContent) {
        continue;
      }

      const matches = [...text.wholeText.matchAll(match)]
        .sort((a, b) => b.index! - a.index!)
        .map((arr) => ({ text: arr[0], index: arr.index! }));

      for (const code of matches) {
        if (!text.textContent || !text.parentElement) {
          continue;
        }
        cb(text, code);
      }
    }
  });
};

export const processIconInTextMarkdown = (
  plugin: IconizePlugin,
  element: HTMLElement,
) => {
  // Ignore if codeblock
  const codeElement = element.querySelector('pre > code');
  const callOut = element.querySelector('.callout');
  if (codeElement && !callOut) {
    return;
  }

  const iconTreeWalker = createTreeWalker(plugin, element);

  const iconShortcodeRegex = createIconShortcodeRegex(plugin);
  const iconIdentifierLength = plugin.getSettings().iconIdentifier.length;

  checkForTextNodes(iconTreeWalker, iconShortcodeRegex, (text, code) => {
    const shortcode = code.text;
    const iconName = shortcode.slice(
      iconIdentifierLength,
      shortcode.length - iconIdentifierLength,
    );

    const iconObject = icon.getIconByName(plugin, iconName);
    if (iconObject) {
      const toReplace = text.splitText(code.index);
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

      const parentElement = toReplace.parentElement;
      const tagName = parentElement?.tagName?.toLowerCase() ?? '';
      let fontSize = calculateFontTextSize();

      if (isHeader(tagName)) {
        fontSize = calculateHeaderSize(tagName as HTMLHeader);
        const svgElement = svg.setFontSize(iconObject.svgElement, fontSize);
        rootSpan.innerHTML = svgElement;
      } else {
        const svgElement = svg.setFontSize(iconObject.svgElement, fontSize);
        rootSpan.innerHTML = svgElement;
      }

      parentElement?.insertBefore(rootSpan, toReplace);
      toReplace.textContent = toReplace.wholeText.substring(code.text.length);

      // We update the size after the animation because the styling won't be set
      // in the first place.
      requestAnimationFrame(() => {
        const parentFontSize = parseFloat(
          getComputedStyle(parentElement).fontSize,
        );
        if (!isNaN(parentFontSize)) {
          rootSpan.innerHTML = svg.setFontSize(
            rootSpan.innerHTML,
            parentFontSize,
          );
        }
      });
    }
  });

  const emojiTreeWalker = createTreeWalker(plugin, element);
  checkForTextNodes(emojiTreeWalker, emoji.getRegex(), (text, code) => {
    if (!emoji.isEmoji(code.text)) {
      return;
    }

    const tagName = text.parentElement?.tagName?.toLowerCase() ?? '';
    let fontSize = calculateFontTextSize();

    if (isHeader(tagName)) {
      fontSize = calculateHeaderSize(tagName as HTMLHeader);
    }

    let emojiValue = emoji.parseEmoji(
      plugin.getSettings().emojiStyle,
      code.text,
      fontSize,
    );

    // When twemoji doesn't recognise a character (e.g. ♟), fall back to native
    // rendering rather than silently dropping it.
    if (!emojiValue) {
      if (plugin.getSettings().emojiStyle === 'twemoji') {
        emojiValue = code.text;
      } else {
        return;
      }
    }

    const toReplace = text.splitText(code.index);
    const emojiNode = createSpan();
    emojiNode.innerHTML = emojiValue;
    toReplace.parentElement?.insertBefore(emojiNode, toReplace);
    toReplace.textContent = toReplace.wholeText.substring(code.text.length);
  });
};
