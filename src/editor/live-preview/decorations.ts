import IconFolderPlugin from '@app/main';
import { Decoration, EditorView } from '@codemirror/view';
import { IconWidget } from './widget';
import { editorLivePreviewField } from 'obsidian';

export const buildDecorations = (
  view: EditorView,
  plugin: IconFolderPlugin,
) => {
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
      widget.setPosition(from, to);
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
