import { Setting } from 'obsidian';
import IconFolderSetting from './iconFolderSetting';

export default class ToggleColorTreeLines extends IconFolderSetting {
  public display(): void {
    new Setting(this.containerEl)
      .setName('Color tree lines like folder icons')
      .setDesc(
        'Colors the indentation line of a folder in the file explorer with the color of its icon. Folders without an icon color keep the theme color.',
      )
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.getSettings().colorTreeLines)
          .onChange(async (enabled) => {
            this.plugin.getSettings().colorTreeLines = enabled;
            this.plugin.applyColorTreeLines();
            await this.plugin.saveIconFolderData();
          });
      });
  }
}
