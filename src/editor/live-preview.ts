import { syntaxTree } from '@codemirror/language';
import {
  ViewPlugin,
  type EditorView,
  ViewUpdate,
  Decoration,
  DecorationSet,
  WidgetType,
} from '@codemirror/view';
import { editorLivePreviewField } from 'obsidian';
import IconFolderPlugin from '../main';
import icon from '@app/lib/icon';

class IconWidget extends WidgetType {
  constructor(
    public id: string,
    public plugin: IconFolderPlugin,
  ) {
    super();
  }

  eq(other: IconWidget) {
    return other.id === this.id;
  }

  toDOM() {
    const _icon = icon.getIconByName(this.id);
    const wrap = createSpan({
      attr: { 'aria-label': this.id },
    });

    if (_icon) {
      const svg = createSvg('svg', {
        attr: {
          width: '24',
          height: '24',
          viewBox: _icon.svgViewbox,
          fill: 'currentColor',
          'aria-hidden': true,
        },
      });
      svg.innerHTML = _icon.svgContent;
      wrap.replaceChildren(svg);
    } else {
      wrap.append(`:${this.id}:`);
    }

    return wrap;
  }

  ignoreEvent(): boolean {
    return true;
  }
}

const icons = (view: EditorView, plugin: IconFolderPlugin) => {
  const ranges: [code: string, from: number, to: number][] = [];

  const getRange = (from: number, to: number): void => {
    const text = view.state.doc.sliceString(from, to);
    if (!text.trim()) return;

    for (const match of text.matchAll(/:\+1:|:-1:|:[\w-]+:/g)) {
      const code = match[0].substring(1, match[0].length - 1);
      if (icon.getIconByName(code)) {
        ranges.push([
          code,
          from + match.index!,
          from + match.index! + match[0].length,
        ]);
      }
    }
  };

  for (const { from, to } of view.visibleRanges) {
    let prevTo = from;
    syntaxTree(view.state).iterate({
      from,
      to,
      enter: (node) => {
        if (node.from !== prevTo) {
          getRange(prevTo, node.from);
        }
        prevTo = node.to;
        getRange(from, to);
      },
    });
    if (prevTo !== to) getRange(prevTo, from);
  }

  return Decoration.set(
    ranges.map(([code, from, to]) => {
      if (view.state.field(editorLivePreviewField)) {
        return Decoration.replace({
          widget: new IconWidget(code, plugin),
          side: 1,
        }).range(from, to);
      }

      return Decoration.widget({
        widget: new IconWidget(code, plugin),
        side: 1,
      }).range(to);
    }),
  );
};

export const buildIconPlugin = (plugin: IconFolderPlugin) => {
  return ViewPlugin.fromClass(
    class IconPlugin {
      decorations: DecorationSet;
      plugin: IconFolderPlugin;

      constructor(view: EditorView) {
        this.plugin = plugin;
        this.decorations = icons(view, plugin);
      }

      update(update: ViewUpdate) {
        const previousMode = update.startState.field(editorLivePreviewField);
        const currentMode = update.state.field(editorLivePreviewField);
        if (
          update.docChanged ||
          update.viewportChanged ||
          previousMode !== currentMode
        ) {
          this.decorations = icons(update.view, this.plugin);
        }
      }
    },
    {
      decorations: (v) => v.decorations,
    },
  );
};
