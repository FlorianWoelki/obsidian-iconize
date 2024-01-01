import { Notice, Setting } from 'obsidian';
import IconFolderSetting from './iconFolderSetting';
import config from '@app/config';

export default class ToggleIconsInEditor extends IconFolderSetting {
  public display(): void {
    new Setting(this.containerEl)
      .setName('Toggle icons while editing notes')
      .setDesc(
        'Toggles whether you are able to add and see icons in your notes and editor (e.g., ability to have :LiSofa: as an icon in your notes).',
      )
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.getSettings().iconsInNotesEnabled)
          .onChange(async (enabled) => {
            this.plugin.getSettings().iconsInNotesEnabled = enabled;
            await this.plugin.saveIconFolderData();
            new Notice(
              `[${config.PLUGIN_NAME}] Obsidian has to be restarted for this change to take effect.`,
            );
          });
      });
  }
}
