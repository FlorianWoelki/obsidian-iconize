import emoji from '@app/emoji';
import { Icon } from '@app/icon-pack-manager';
import IconFolderPlugin from '@app/main';
import { WidgetType } from '@codemirror/view';

export class IconInLinkWidget extends WidgetType {
  constructor(
    public plugin: IconFolderPlugin,
    public iconData: Icon | string,
    public path: string,
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

    if (emoji.isEmoji(innerHTML)) {
      innerHTML = emoji.parseEmoji(
        this.plugin.getSettings().emojiStyle,
        innerHTML,
      );
    }

    iconNode.innerHTML = innerHTML;
    return iconNode;
  }

  ignoreEvent(): boolean {
    return true;
  }
}
