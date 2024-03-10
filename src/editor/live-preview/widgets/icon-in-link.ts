import { Icon } from '@app/icon-pack-manager';
import IconFolderPlugin from '@app/main';
import { WidgetType } from '@codemirror/view';

export class IconInLinkWidget extends WidgetType {
  constructor(
    public plugin: IconFolderPlugin,
    public iconData: Icon | string,
  ) {
    super();
  }

  toDOM() {
    const iconNode = document.createElement('span');
    const iconName =
      typeof this.iconData === 'string'
        ? this.iconData
        : this.iconData.prefix + this.iconData.name;
    iconNode.setAttribute('title', iconName);
    iconNode.classList.add('iconize-icon-in-link');

    if (typeof this.iconData === 'string') {
      iconNode.style.transform = 'translateY(0)';
    }

    iconNode.innerHTML =
      typeof this.iconData === 'string'
        ? this.iconData
        : this.iconData.svgElement;
    return iconNode;
  }

  ignoreEvent(): boolean {
    return true;
  }
}
