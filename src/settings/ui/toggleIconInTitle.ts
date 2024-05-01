import { DropdownComponent, MarkdownView, Setting } from 'obsidian';
import { calculateInlineTitleSize } from '@app/lib/util/text';
import IconFolderSetting from './iconFolderSetting';
import icon from '@lib/icon';
import titleIcon from '@lib/icon-title';
import { InlineTitleView } from '@app/@types/obsidian';
import { IconInTitlePosition } from '@app/settings/data';

export default class ToggleIconInTitle extends IconFolderSetting {
  private dropdown: DropdownComponent;

  public display(): void {
    new Setting(this.containerEl)
      .setName('Toggle icon in title')
      .setDesc('Toggles the visibility of an icon above the title of a file.')
      .addDropdown((dropdown) => {
        this.dropdown = dropdown;
        dropdown.addOptions({
          above: 'Above title',
          inline: 'Next to title',
        });
        dropdown.setValue(this.plugin.getSettings().iconInTitlePosition);
        dropdown.onChange(async (value) => {
          this.plugin.getSettings().iconInTitlePosition =
            value as IconInTitlePosition;
          await this.plugin.saveIconFolderData();
        });
      })
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.getSettings().iconInTitleEnabled)
          .onChange(async (enabled) => {
            if (this.dropdown) {
              this.dropdown.setDisabled(!enabled);
            }

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
                    titleIcon.add(this.plugin, view.inlineTitleEl, content, {
                      fontSize: calculateInlineTitleSize(),
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
