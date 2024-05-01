import { DropdownComponent, MarkdownView, Setting } from 'obsidian';
import { calculateInlineTitleSize } from '@app/lib/util/text';
import IconFolderSetting from './iconFolderSetting';
import icon from '@lib/icon';
import titleIcon from '@lib/icon-title';
import { InlineTitleView } from '@app/@types/obsidian';
import { IconInTitlePosition } from '@app/settings/data';

interface UpdateLeavesOptions {
  /**
   * Decides whether to enable or disable the icon in the title.
   */
  enabled: boolean;
  /**
   * If true, removes the icon of the title before re-adding it.
   * Enabling this option is useful when the icon position is updated and therefore
   * the DOM needs to be updated.
   * @default false
   */
  removeBeforeReAdd?: boolean;
}

export default class ToggleIconInTitle extends IconFolderSetting {
  private dropdown: DropdownComponent;

  private updateLeaves(options: UpdateLeavesOptions): void {
    this.plugin.app.workspace.getLeavesOfType('markdown').forEach((leaf) => {
      const view = leaf.view as InlineTitleView;
      if (view instanceof MarkdownView) {
        const foundIcon = icon.getIconByPath(this.plugin, view.file.path);

        if (foundIcon && options.enabled) {
          if (options.removeBeforeReAdd) {
            // Remove the icon before re-adding it. This is needed to update the DOM because
            // the icon node will be inserted in the beginning inline title node.
            titleIcon.remove(view.contentEl);
          }

          const content =
            typeof foundIcon === 'string' ? foundIcon : foundIcon.svgElement;
          titleIcon.add(this.plugin, view.inlineTitleEl, content, {
            fontSize: calculateInlineTitleSize(),
          });
        } else {
          titleIcon.remove(view.contentEl);
        }
      }
    });
  }

  public display(): void {
    new Setting(this.containerEl)
      .setName('Toggle icon in title')
      .setDesc('Toggles the visibility of an icon above the title of a file.')
      .addDropdown((dropdown) => {
        this.dropdown = dropdown;
        dropdown.setDisabled(!this.plugin.getSettings().iconInTitleEnabled);
        dropdown.addOptions({
          above: 'Above title',
          inline: 'Next to title',
        });
        dropdown.setValue(this.plugin.getSettings().iconInTitlePosition);
        dropdown.onChange(async (value) => {
          this.plugin.getSettings().iconInTitlePosition =
            value as IconInTitlePosition;
          await this.plugin.saveIconFolderData();
          this.updateLeaves({ enabled: true, removeBeforeReAdd: true });
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
            this.updateLeaves({ enabled });
          });
      });
  }
}
