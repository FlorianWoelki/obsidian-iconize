import emoji from '@app/emoji';
import icon from '@app/lib/icon';
import svg from '@app/lib/util/svg';
import {
  HTMLHeader,
  calculateFontTextSize,
  calculateHeaderSize,
} from '@app/lib/util/text';
import IconizePlugin from '@app/main';
import { EditorView, WidgetType } from '@codemirror/view';

export class IconInTextWidget extends WidgetType {
  private start = -1;
  private end = -1;

  constructor(
    public plugin: IconizePlugin,
    public id: string,
  ) {
    super();
  }

  setPosition(start: number, end: number): void {
    this.start = start;
    this.end = end;
  }

  eq(other: IconInTextWidget) {
    return other instanceof IconInTextWidget && other.id === this.id;
  }

  private getSize(view: EditorView): number {
    let fontSize = calculateFontTextSize();

    const line = view.state.doc.lineAt(this.end);
    const headerMatch = line.text.match(/^#{1,6}\s/);
    if (headerMatch && headerMatch[0].trim()) {
      const mapping: Record<string, HTMLHeader> = {
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

    return fontSize;
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

    const foundIcon = icon.getIconByName(this.plugin, this.id);
    const fontSize = this.getSize(view);

    if (foundIcon) {
      const svgElement = svg.setFontSize(foundIcon.svgElement, fontSize);
      wrap.style.display = 'inline-flex';
      wrap.style.transform = 'translateY(13%)';
      wrap.innerHTML = svgElement;
    } else if (emoji.isEmoji(this.id)) {
  // FIXED: Handle cases where twemoji doesn't support the emoji (like ♟)
  let emojiValue = emoji.parseEmoji(
    this.plugin.getSettings().emojiStyle,
    this.id,
    fontSize,
  );

  // Fall back to native emoji if twemoji fails
  if (!emojiValue && this.plugin.getSettings().emojiStyle === 'twemoji') {
    emojiValue = this.id;
  }

  // Only set innerHTML if we have a valid emoji value
  if (emojiValue) {
    wrap.innerHTML = emojiValue;
  }
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
