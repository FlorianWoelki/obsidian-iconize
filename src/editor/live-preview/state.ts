import { syntaxTree, tokenClassNodeProp } from '@codemirror/language';
import icon from '@app/lib/icon';
import {
  EditorState,
  Range,
  RangeSet,
  RangeSetBuilder,
  RangeValue,
  StateField,
} from '@codemirror/state';

export type PositionField = StateField<RangeSet<IconPosition>>;

type UpdateRangeFunc = (
  from: number,
  to: number,
  value: IconPosition,
  remove: boolean,
) => void;

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

/**
 * Builds a position field for the editor state. This field will track the
 * positions of the icons in the document.
 **/
export const buildPositionField = () => {
  /**
   * Checks the ranges of the icons in the document. If the range is not
   * excluded, the range is added to the range set. If the range is excluded,
   * the range is removed from the range set.
   * @param state EditorState to get the ranges from.
   * @param excludeFrom Number to exclude from the ranges.
   * @param excludeTo Number to exclude to the ranges.
   * @param updateRange Function callback to update the range.
   */
  const checkRanges = (
    state: EditorState,
    excludeFrom: number,
    excludeTo: number,
    updateRange: UpdateRangeFunc,
  ): void => {
    const text = state.doc.sliceString(0, state.doc.length);
    for (const { 0: rawCode, index: offset } of text.matchAll(
      /(:)((\w{1,64}:\d{17,18})|(\w{1,64}))(:)/g,
    )) {
      const iconName = rawCode.substring(1, rawCode.length - 1);
      if (!icon.getIconByName(iconName)) {
        continue;
      }

      const from = offset;
      const to = offset + rawCode.length;

      if (!isNodeInRangeAccepted(state, from, to)) {
        continue;
      }

      if (offset < excludeFrom || offset > excludeTo) {
        updateRange(from, to, new IconPosition(iconName), false);
        continue;
      }

      updateRange(from, to, new IconPosition(iconName), true);
    }
  };

  const isNodeInRangeAccepted = (
    state: EditorState,
    from: number,
    to: number,
  ) => {
    let isRangeAccepted = true;
    syntaxTree(state).iterate({
      from,
      to,
      enter: ({ type }) => {
        if (type.name === 'Document') {
          return;
        }

        const allowedNodeTypes: string[] = [
          'header',
          'strong',
          'em',
          'quote',
          'link',
          'list-1',
          'list-2',
          'list-3',
          'highlight',
          'footref',
          'comment',
          'link-alias',
        ];
        const excludedNodeTypes: string[] = [
          'formatting',
          'hmd-codeblock',
          'inline-code',
          'hr',
        ];
        const nodeProps: string = type.prop(tokenClassNodeProp) ?? '';
        const s = new Set(nodeProps.split(' '));

        if (
          excludedNodeTypes.some((t) => s.has(t)) &&
          allowedNodeTypes.every((t) => !s.has(t))
        ) {
          isRangeAccepted = false;
        }
      },
    });
    return isRangeAccepted;
  };

  return StateField.define<RangeSet<IconPosition>>({
    create: (state) => {
      const rangeSet = new RangeSetBuilder<IconPosition>();
      // Check all the ranges of the icons in the entire document. There is no
      // exclusion going on here.
      checkRanges(state, -1, -1, rangeSet.add.bind(rangeSet));
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

          // Checks the ranges of the icons in the document except for the
          // excluded line start and end.
          checkRanges(
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

        // Checks the ranges of the icons in the document except for the excluded
        // line start and end.
        checkRanges(
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
