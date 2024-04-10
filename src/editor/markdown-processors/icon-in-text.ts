// TODO: Optimize the code to reduce the number of iterations and improve the
// performance.

import svg from '@app/lib/util/svg';
import icon from '@app/lib/icon';
import {
  Header,
  calculateFontTextSize,
  calculateHeaderSize,
  isHeader,
} from '@app/lib/util/text';
import IconFolderPlugin from '@app/main';
import emoji from '@app/emoji';

const createIconShortcodeRegex = (plugin: IconFolderPlugin): RegExp => {
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
  plugin: IconFolderPlugin,
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

const checkForTextNodes = (
  treeWalker: TreeWalker,
  match: RegExp,
  cb: (text: Text, code: { text: string; index: number }) => void,
): void => {
  let currentNode = treeWalker.currentNode;
  while (currentNode) {
    if (currentNode.nodeType === Node.TEXT_NODE) {
      const text = currentNode as Text;
      const textNodes = [...Array.from(text.parentElement!.childNodes)].filter(
        (n): n is Text => n instanceof Text,
      );
      for (const text of textNodes) {
        for (const code of [...text.wholeText.matchAll(match)]
          .sort((a, b) => b.index - a.index)
          .map((arr) => ({ text: arr[0], index: arr.index! }))) {
          if (!text.textContent) {
            continue;
          }

          cb(text, code);
        }
      }
    }
    currentNode = treeWalker.nextNode();
  }
};

export const processIconInTextMarkdown = (
  plugin: IconFolderPlugin,
  element: HTMLElement,
) => {
  // Ignore if codeblock
  const codeElement = element.querySelector('pre > code');
  if (codeElement) {
    return;
  }

  const treeWalker = createTreeWalker(plugin, element);

  const iconShortcodeRegex = createIconShortcodeRegex(plugin);
  const iconIdentifierLength = plugin.getSettings().iconIdentifier.length;

  checkForTextNodes(treeWalker, iconShortcodeRegex, (text, code) => {
    const shortcode = code.text;
    const iconName = shortcode.slice(
      iconIdentifierLength,
      shortcode.length - iconIdentifierLength,
    );

    const iconObject = icon.getIconByName(iconName);
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

      const tagName = toReplace.parentElement?.tagName?.toLowerCase() ?? '';
      let fontSize = calculateFontTextSize();

      if (isHeader(tagName)) {
        fontSize = calculateHeaderSize(tagName as Header);
        const svgElement = svg.setFontSize(iconObject.svgElement, fontSize);
        rootSpan.innerHTML = svgElement;
      } else {
        const svgElement = svg.setFontSize(iconObject.svgElement, fontSize);
        rootSpan.innerHTML = svgElement;
      }

      toReplace.parentElement?.insertBefore(rootSpan, toReplace);
      toReplace.textContent = toReplace.wholeText.substring(code.text.length);
    }
  });

  checkForTextNodes(treeWalker, emoji.getRegex(), (text, code) => {
    if (plugin.getSettings().emojiStyle === 'twemoji') {
      const toReplace = text.splitText(code.index);

      const tagName = toReplace.parentElement?.tagName?.toLowerCase() ?? '';
      let fontSize = calculateFontTextSize();

      if (isHeader(tagName)) {
        fontSize = calculateHeaderSize(tagName as Header);
      }

      const emojiValue = emoji.parseEmoji(
        plugin.getSettings().emojiStyle,
        code.text,
        fontSize,
      );
      if (!emojiValue) {
        return;
      }

      const emojiNode = createSpan();
      emojiNode.innerHTML = emojiValue;
      toReplace.parentElement?.insertBefore(emojiNode, toReplace);
      toReplace.textContent = toReplace.wholeText.substring(code.text.length);
    }
  });
};
