import IconFolderPlugin from '@app/main';
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
} from '@codemirror/view';
import { buildTextDecorations } from '@app/editor/live-preview/decorations';

export const buildIconInTextPlugin = (plugin: IconFolderPlugin) => {
  return ViewPlugin.fromClass(
    class IconPlugin {
      decorations: DecorationSet;
      plugin: IconFolderPlugin;

      constructor(view: EditorView) {
        this.plugin = plugin;
        this.decorations = buildTextDecorations(view, plugin);
      }

      update(update: ViewUpdate) {
        this.decorations = buildTextDecorations(update.view, this.plugin);
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
