import IconFolderPlugin from '@app/main';
import { Decoration, EditorView } from '@codemirror/view';
import { MarkdownView, editorInfoField } from 'obsidian';
import { RangeSetBuilder } from '@codemirror/state';
import { syntaxTree, tokenClassNodeProp } from '@codemirror/language';
import icon from '@lib/icon';
import { IconInLinkWidget } from '../widgets';
import { HeaderToken } from '@app/lib/util/text';

export const buildLinkDecorations = (
  view: EditorView,
  plugin: IconFolderPlugin,
) => {
  const builder = new RangeSetBuilder<Decoration>();
  const mdView = view.state.field(editorInfoField) as MarkdownView;

  for (const { from, to } of view.visibleRanges) {
    syntaxTree(view.state).iterate({
      from,
      to,
      enter: (node) => {
        const tokenProps = node.type.prop(tokenClassNodeProp);
        if (tokenProps) {
          const props = new Set(tokenProps.split(' '));
          const isLink = props.has('hmd-internal-link');
          const headerType = [
            'header-1',
            'header-2',
            'header-3',
            'header-4',
            'header-5',
            'header-6',
          ].find((header) => props.has(header)) as HeaderToken | null;

          if (isLink) {
            let linkText = view.state.doc.sliceString(node.from, node.to);
            linkText = linkText.split('#')[0];
            const file = plugin.app.metadataCache.getFirstLinkpathDest(
              linkText,
              mdView.file.basename,
            );

            if (file) {
              const possibleIcon = icon.getIconByPath(plugin, file.path);

              if (possibleIcon) {
                const iconDecoration = Decoration.widget({
                  widget: new IconInLinkWidget(
                    plugin,
                    possibleIcon,
                    file.path,
                    headerType,
                  ),
                });

                builder.add(node.from, node.from, iconDecoration);
              }
            }
          }
        }
      },
    });
  }

  return builder.finish();
};
