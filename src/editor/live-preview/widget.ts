import icon from '@app/lib/icon';
import svg from '@app/lib/util/svg';
import {
  Header,
  calculateFontTextSize,
  calculateHeaderSize,
} from '@app/lib/util/text';
import IconFolderPlugin from '@app/main';
import { EditorView, WidgetType } from '@codemirror/view';

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
      wrap.innerHTML = svgElement;
    } else {
      wrap.append(`:${this.id}:`);
    }

    return wrap;
  }

  ignoreEvent(): boolean {
    return false;
  }
}
