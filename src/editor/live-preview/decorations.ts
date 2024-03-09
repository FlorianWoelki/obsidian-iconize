import IconFolderPlugin from '@app/main';
import { Decoration, EditorView } from '@codemirror/view';
import {
  MarkdownView,
  editorInfoField,
  editorLivePreviewField,
} from 'obsidian';
import { RangeSetBuilder } from '@codemirror/state';
import { syntaxTree, tokenClassNodeProp } from '@codemirror/language';
import icon from '@lib/icon';
import { IconInLinkWidget, IconWidget } from './widget';
import { Icon } from '@app/icon-pack-manager';

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
                  widget: new IconInLinkWidget(plugin, possibleIcon as Icon),
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
