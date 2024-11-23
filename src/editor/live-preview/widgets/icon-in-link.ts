import emoji from '@app/emoji';
import { Icon } from '@app/icon-pack-manager';
import {
  calculateFontTextSize,
  calculateHeaderSize,
  HeaderToken,
} from '@app/lib/util/text';
import svg from '@app/lib/util/svg';
import IconizePlugin from '@app/main';
import { WidgetType } from '@codemirror/view';

export class IconInLinkWidget extends WidgetType {
  constructor(
    private plugin: IconizePlugin,
    private iconData: Icon | string,
    private path: string,
    private headerType: HeaderToken | null,
  ) {
    super();
  }

  toDOM() {
    const iconNode = document.createElement('span');
    const iconName =
      typeof this.iconData === 'string'
        ? this.iconData
        : this.iconData.prefix + this.iconData.name;
    iconNode.style.color =
      this.plugin.getIconColor(this.path) ??
      this.plugin.getSettings().iconColor;
    iconNode.setAttribute('title', iconName);
    iconNode.classList.add('iconize-icon-in-link');

    if (typeof this.iconData === 'string') {
      iconNode.style.transform = 'translateY(0)';
    }

    let innerHTML =
      typeof this.iconData === 'string'
        ? this.iconData
        : this.iconData.svgElement;

    let fontSize = calculateFontTextSize();
    if (this.headerType) {
      fontSize = calculateHeaderSize(this.headerType);
    }

    if (emoji.isEmoji(innerHTML)) {
      innerHTML = emoji.parseEmoji(
        this.plugin.getSettings().emojiStyle,
        innerHTML,
        fontSize,
      );
    } else {
      innerHTML = svg.setFontSize(innerHTML, fontSize);
    }

    iconNode.innerHTML = innerHTML;
    return iconNode;
  }

  ignoreEvent(): boolean {
    return true;
  }
}
