import { Setting } from 'obsidian';
import IconFolderSetting from './iconFolderSetting';

export default class ToggleFrontmatterIcon extends IconFolderSetting {
  public display(): void {
    new Setting(this.containerEl)
      .setName('Use icon in frontmatter')
      .setDesc(
        'Toggles whether to set the icon based on the frontmatter property `icon`.',
      )
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.getSettings().iconInFrontmatterEnabled)
          .onChange(async (enabled) => {
            this.plugin.getSettings().iconInFrontmatterEnabled = enabled;
            await this.plugin.saveIconFolderData();
          });
      });
  }
}
