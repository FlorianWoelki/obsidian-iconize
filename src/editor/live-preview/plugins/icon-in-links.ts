import IconizePlugin from '@app/main';
import {
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
} from '@codemirror/view';
import { buildLinkDecorations } from '@app/editor/live-preview/decorations';

export const buildIconInLinksPlugin = (plugin: IconizePlugin) => {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      plugin: IconizePlugin;

      constructor(view: EditorView) {
        this.plugin = plugin;
        this.decorations = buildLinkDecorations(view, plugin);
      }

      destroy() {}

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = buildLinkDecorations(update.view, this.plugin);
        }
      }
    },
    {
      decorations: (v) => v.decorations,
    },
  );
};
