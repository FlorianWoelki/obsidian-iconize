import IconFolderPlugin from '@app/main';
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
} from '@codemirror/view';
import { buildDecorations } from './decorations';

export const buildIconPlugin = (plugin: IconFolderPlugin) => {
  return ViewPlugin.fromClass(
    class IconPlugin {
      decorations: DecorationSet;
      plugin: IconFolderPlugin;

      constructor(view: EditorView) {
        this.plugin = plugin;
        this.decorations = buildDecorations(view, plugin);
      }

      update(update: ViewUpdate) {
        this.decorations = buildDecorations(update.view, this.plugin);
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
