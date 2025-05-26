import { Notice, Setting } from 'obsidian';
import { T } from '../../locales/translations';
import IconFolderSetting from './iconFolderSetting';
import config from '@app/config';

export default class UseInternalPlugins extends IconFolderSetting {
  public display(): void {
    new Setting(this.containerEl)
      .setName(T('EXPERIMENTAL: Use internal plugins'))
      .setDesc(
        T('Toggles whether to try to add icons to the bookmark and outline internal plugins.'),
      )
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.getSettings().useInternalPlugins)
          .onChange(async (enabled) => {
            this.plugin.getSettings().useInternalPlugins = enabled;
            await this.plugin.saveIconFolderData();
            new Notice(
              `[${config.PLUGIN_NAME}] Obsidian has to be restarted for this change to take effect.`,
            );
          });
      });
  }
}
