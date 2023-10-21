import { MarkdownView, Setting } from 'obsidian';
import IconFolderSetting from './iconFolderSetting';
import icon from '../../lib/icon';
import titleIcon from '../../lib/icon-title';
import { InlineTitleView } from '../../@types/obsidian';

export default class ToggleIconInTitle extends IconFolderSetting {
  public display(): void {
    new Setting(this.containerEl)
      .setName('Toggle Icon in Title')
      .setDesc('Toggles the visibility of an icon for a file above the title.')
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.getSettings().iconInTitleEnabled)
          .onChange(async (enabled) => {
            this.plugin.getSettings().iconInTitleEnabled = enabled;
            await this.plugin.saveIconFolderData();

            // Updates the already opened files.
            this.plugin.app.workspace
              .getLeavesOfType('markdown')
              .forEach((leaf) => {
                const view = leaf.view as InlineTitleView;
                if (view instanceof MarkdownView) {
                  const foundIcon = icon.getIconByPath(
                    this.plugin,
                    view.file.path,
                  );

                  if (foundIcon && enabled) {
                    const content =
                      typeof foundIcon === 'string'
                        ? foundIcon
                        : foundIcon.svgElement;
                    titleIcon.add(view.inlineTitleEl, content, {
                      fontSize: this.plugin.calculateIconInTitleSize(),
                    });
                  } else {
                    titleIcon.hide(view.contentEl);
                  }
                }
              });
          });
      });
  }
}
