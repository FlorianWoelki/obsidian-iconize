import { Setting } from 'obsidian';
import IconFolderSetting from './iconFolderSetting';
import { DEFAULT_SETTINGS } from '../settings';
import style from '../lib/style';

export default class IconFontSizeSetting extends IconFolderSetting {
  public display(): void {
    new Setting(this.containerEl)
      .setName('Icon font size (in pixels)')
      .setDesc('Change the font size of the displayed icons.')
      .addSlider((slider) => {
        slider
          .setLimits(10, 24, 1)
          .setDynamicTooltip()
          .setValue(this.plugin.getSettings().fontSize ?? DEFAULT_SETTINGS.fontSize)
          .onChange(async (val) => {
            this.plugin.getSettings().fontSize = val;
            await this.plugin.saveIconFolderData();

            style.refreshAllIcons(this.plugin);
          });
      });
  }
}
