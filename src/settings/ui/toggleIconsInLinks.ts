import { Notice, Setting } from 'obsidian';
import { T } from '../../locales/translations';
import IconFolderSetting from './iconFolderSetting';
import config from '@app/config';

export default class ToggleIconsInLinks extends IconFolderSetting {
  public display(): void {
    new Setting(this.containerEl)
      .setName(T('Toggle icons in links'))
      .setDesc(
        T('Toggles whether you are able to see icons in the links to other notes'),
      )
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.getSettings().iconsInLinksEnabled)
          .onChange(async (enabled) => {
            this.plugin.getSettings().iconsInLinksEnabled = enabled;
            await this.plugin.saveIconFolderData();
            new Notice(
              `[${config.PLUGIN_NAME}] Obsidian has to be restarted for this change to take effect.`,
            );
          });
      });
  }
}
