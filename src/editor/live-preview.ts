import {
  EditorState,
  Range,
  RangeSet,
  RangeSetBuilder,
  RangeValue,
  StateField,
} from '@codemirror/state';
import {
  ViewPlugin,
  EditorView,
  ViewUpdate,
  Decoration,
  DecorationSet,
  WidgetType,
} from '@codemirror/view';
import { editorLivePreviewField } from 'obsidian';
import IconFolderPlugin from '../main';
import icon from '@app/lib/icon';

export type PositionField = StateField<RangeSet<IconPosition>>;

class IconPosition extends RangeValue {
  constructor(public text: string) {
    super();
  }

  get iconId(): string {
    return this.text;
  }

  eq(other: RangeValue): boolean {
    return other instanceof IconPosition && other.text === this.text;
  }
}

export const getField = () => {
  const getRanges = (
    state: EditorState,
    excludeFrom: number,
    excludeTo: number,
    updateRange: (
      from: number,
      to: number,
      value: IconPosition,
      remove: boolean,
    ) => void,
  ) => {
    const saveRange = (from: number, to: number): void => {
      const t = state.doc.sliceString(0, state.doc.length);
      for (const { 0: rawCode, index: offset } of t.matchAll(
        /:\+1:|:-1:|:[\w-]+:/g,
      )) {
        const code = rawCode.substring(1, rawCode.length - 1);
        if (!icon.getIconByName(code)) {
          continue;
        }

        if (offset < from || offset > to) {
          updateRange(
            offset!,
            offset! + rawCode.length,
            new IconPosition(code),
            false,
          );
          continue;
        }

        updateRange(
          offset!,
          offset! + rawCode.length,
          new IconPosition(code),
          true,
        );
      }
    };

    saveRange(excludeFrom, excludeTo);
  };

  return StateField.define<RangeSet<IconPosition>>({
    create: (state) => {
      const rangeSet = new RangeSetBuilder<IconPosition>();
      getRanges(state, 0, state.doc.length, rangeSet.add.bind(rangeSet));
      return rangeSet.finish();
    },
    update: (rangeSet, transaction) => {
      const newRanges: Range<IconPosition>[] = [];
      if (!transaction.docChanged) {
        if (transaction.selection) {
          const from = transaction.selection.ranges[0].from;
          const to = transaction.selection.ranges[0].to;
          const lineEnd = transaction.state.doc.lineAt(to).length;
          const lineStart = transaction.state.doc.lineAt(from).from;
          getRanges(
            transaction.state,
            lineStart,
            lineStart + lineEnd,
            (from, to, value, removed) => {
              rangeSet = rangeSet.update({
                filterFrom: from,
                filterTo: to,
                filter: () => false,
              });
              if (!removed) {
                newRanges.push(value.range(from, to));
              }
            },
          );
        }

        rangeSet = rangeSet.update({ add: newRanges });
        return rangeSet;
      }

      rangeSet = rangeSet.map(transaction.changes);

      const changedLines: [lineStart: number, lineEnd: number][] = [];
      transaction.changes.iterChangedRanges((_f, _t, from, to) => {
        changedLines.push([
          transaction.state.doc.lineAt(from).number,
          transaction.state.doc.lineAt(to).number,
        ]);
      });

      for (const [_, end] of changedLines) {
        const lineEnd = transaction.state.doc.line(end).length;
        const lineStart = transaction.state.doc.line(end).from;

        getRanges(
          transaction.state,
          lineStart,
          lineStart + lineEnd,
          (from, to, value, removed) => {
            rangeSet = rangeSet.update({
              filterFrom: from,
              filterTo: to,
              filter: () => false,
            });
            if (!removed) {
              newRanges.push(value.range(from, to));
            }
          },
        );
      }
      rangeSet = rangeSet.update({ add: newRanges });
      return rangeSet;
    },
  });
};

class IconWidget extends WidgetType {
  constructor(
    public plugin: IconFolderPlugin,
    public id: string,
  ) {
    super();
  }

  eq(other: IconWidget) {
    return other instanceof IconWidget && other.id === this.id;
  }

  toDOM() {
    const wrap = createSpan({
      cls: 'cm-iconize-icon',
      attr: { 'aria-label': this.id },
    });

    const _icon = icon.getIconByName(this.id);

    if (_icon) {
      const svg = createSvg('svg', {
        attr: {
          width: '16px',
          height: '16px',
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': '2',
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
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
    return false;
  }
}

const icons = (view: EditorView, plugin: IconFolderPlugin) => {
  const ranges: [iconId: string, from: number, to: number][] = [];
  const iconInfo = view.state.field(plugin.positionField);
  for (const { from, to } of view.visibleRanges) {
    iconInfo.between(from - 1, to + 1, (from, to, { iconId }) => {
      ranges.push([iconId, from, to]);
    });
  }
  return Decoration.set(
    ranges.map(([code, from, to]) => {
      const widget = new IconWidget(plugin, code);
      if (view.state.field(editorLivePreviewField)) {
        return Decoration.replace({
          widget,
          side: -1,
        }).range(from, to);
      }

      return Decoration.widget({
        widget,
        side: -1,
      }).range(to);
    }),
    true,
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
        this.decorations = icons(update.view, this.plugin);
      }
    },
    {
      decorations: (v) => v.decorations,
      provide: (plugin) =>
        EditorView.atomicRanges.of((view) => {
          const value = view.plugin(plugin);
          return value ? value.decorations : Decoration.none;
        }),
    },
  );
};
