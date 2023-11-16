import { Setting } from 'obsidian';
import IconFolderSetting from './iconFolderSetting';
import { DEFAULT_SETTINGS } from '../data';

export default class RecentlyUsedIconsSetting extends IconFolderSetting {
  public display(): void {
    new Setting(this.containerEl)
      .setName('Recently used Icons limit')
      .setDesc(
        'Change the limit for the recently used icons displayed in the icon modal.',
      )
      .addSlider((slider) => {
        slider
          .setLimits(1, 25, 1)
          .setDynamicTooltip()
          .setValue(
            this.plugin.getSettings().recentlyUsedIconsSize ??
              DEFAULT_SETTINGS.recentlyUsedIconsSize,
          )
          .onChange(async (val) => {
            this.plugin.getSettings().recentlyUsedIconsSize = val;
            await this.plugin.checkRecentlyUsedIcons();
            await this.plugin.saveIconFolderData();
          });
      });
  }
}
