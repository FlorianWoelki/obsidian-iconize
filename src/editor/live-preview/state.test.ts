import {
  EditorState,
  RangeSet,
  RangeValue,
  StateEffect,
} from '@codemirror/state';
import { describe, expect, it, vi } from 'vitest';
import { buildPositionField } from './state';

vi.mock('@app/lib/icon', () => ({
  default: {
    getIconByName: vi.fn((_plugin, iconName) =>
      iconName === 'LiSmile' ? { svgElement: '<svg></svg>' } : undefined,
    ),
  },
}));

vi.mock('@app/emoji', () => ({
  default: {
    getRegex: () => /a^/g,
    isEmoji: () => false,
  },
}));

const rangeCount = (
  ranges: RangeSet<RangeValue>,
  docLength: number,
): number => {
  let count = 0;
  ranges.between(0, docLength, () => {
    count += 1;
  });
  return count;
};

describe('buildPositionField', () => {
  it('keeps the active line excluded during selectionless view updates', () => {
    const plugin = {
      app: {
        workspace: {
          iterateAllLeaves: vi.fn(),
        },
      },
      getSettings: () => ({ iconIdentifier: ':' }),
    } as any;
    const positionField = buildPositionField(plugin);
    const doc = 'before\ntext :LiSmile: after\nafter';
    let state = EditorState.create({
      doc,
      extensions: [positionField],
    });

    expect(rangeCount(state.field(positionField), state.doc.length)).toBe(1);

    const cursor = doc.indexOf('after');
    state = state.update({ selection: { anchor: cursor } }).state;
    expect(rangeCount(state.field(positionField), state.doc.length)).toBe(0);

    const viewUpdate = StateEffect.define<void>();
    const transaction = state.update({ effects: viewUpdate.of() });
    expect(transaction.selection).toBeUndefined();

    state = transaction.state;
    expect(rangeCount(state.field(positionField), state.doc.length)).toBe(0);
  });
});
