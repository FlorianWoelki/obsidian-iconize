import { Setting } from 'obsidian';
import IconFolderSetting from './iconFolderSetting';

export default class DebugMode extends IconFolderSetting {
  public display(): void {
    new Setting(this.containerEl)
      .setName('Toggle Debug Mode')
      .setDesc(
        'Toggle debug mode to see more detailed logs in the console. Do not touch this unless you know what you are doing.',
      )
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.getSettings().debugMode)
          .onChange(async (enabled) => {
            this.plugin.getSettings().debugMode = enabled;
            await this.plugin.saveIconFolderData();
          });
      });
  }
}
