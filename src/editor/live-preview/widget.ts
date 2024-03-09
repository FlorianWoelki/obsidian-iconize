import { Icon } from '@app/icon-pack-manager';
import icon from '@app/lib/icon';
import svg from '@app/lib/util/svg';
import {
  Header,
  calculateFontTextSize,
  calculateHeaderSize,
} from '@app/lib/util/text';
import IconFolderPlugin from '@app/main';
import { EditorView, WidgetType } from '@codemirror/view';

export class IconInLinkWidget extends WidgetType {
  constructor(
    public plugin: IconFolderPlugin,
    public iconData: Icon,
  ) {
    super();
  }

  toDOM() {
    const iconNode = document.createElement('span');
    iconNode.setAttribute('title', this.iconData.prefix + this.iconData.name);
    iconNode.classList.add('iconize-icon-in-link');
    iconNode.innerHTML = this.iconData.svgElement;
    return iconNode;
  }

  ignoreEvent(): boolean {
    return true;
  }
}

export class IconWidget extends WidgetType {
  private start = -1;
  private end = -1;

  constructor(
    public plugin: IconFolderPlugin,
    public id: string,
  ) {
    super();
  }

  setPosition(start: number, end: number): void {
    this.start = start;
    this.end = end;
  }

  eq(other: IconWidget) {
    return other instanceof IconWidget && other.id === this.id;
  }

  toDOM(view: EditorView) {
    const wrap = createSpan({
      cls: 'cm-iconize-icon',
      attr: {
        'aria-label': this.id,
        'data-icon': this.id,
        'aria-hidden': 'true',
      },
    });

    const foundIcon = icon.getIconByName(this.id);

    if (foundIcon) {
      let fontSize = calculateFontTextSize();

      const line = view.state.doc.lineAt(this.end);
      const headerMatch = line.text.match(/^#{1,6}\s/);
      if (headerMatch && headerMatch[0].trim()) {
        const mapping: Record<string, Header> = {
          '#': 'h1',
          '##': 'h2',
          '###': 'h3',
          '####': 'h4',
          '#####': 'h5',
          '######': 'h6',
        };

        const header = mapping[headerMatch[0].trim()];
        fontSize = calculateHeaderSize(header);
      }

      const svgElement = svg.setFontSize(foundIcon.svgElement, fontSize);
      wrap.style.display = 'inline-flex';
      wrap.style.transform = 'translateY(13%)';
      wrap.innerHTML = svgElement;
    } else {
      wrap.append(
        `${this.plugin.getSettings().iconIdentifier}${this.id}${
          this.plugin.getSettings().iconIdentifier
        }`,
      );
    }

    return wrap;
  }

  ignoreEvent(): boolean {
    return false;
  }
}
