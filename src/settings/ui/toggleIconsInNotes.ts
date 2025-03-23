import { Notice, Setting } from 'obsidian';
import { T } from '../../locales/translations';
import IconFolderSetting from './iconFolderSetting';
import config from '@app/config';

export default class ToggleIconsInEditor extends IconFolderSetting {
  public display(): void {
    new Setting(this.containerEl)
      .setName(T('Toggle icons while editing notes'))
      .setDesc(
        T('Toggles whether you are able to add and see icons in your notes and editor (e.g., ability to have :LiSofa: as an icon in your notes).'),
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
