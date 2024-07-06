import { Setting, ColorComponent } from 'obsidian';
import IconFolderSetting from './iconFolderSetting';
import helper from '../helper';
import { ResetButtonComponent } from '../ResetButtonComponent';
import { DEFAULT_SETTINGS } from '../data';

const DEFAULT_VALUE = DEFAULT_SETTINGS.iconColor;

export default class IconColorSetting extends IconFolderSetting {
  public display(): void {
    const setting = new Setting(this.containerEl)
      .setName('Icon color')
      .setDesc('Change the color of the displayed icons.');

    new ResetButtonComponent(setting.controlEl).onClick(async () => {
      colorPicker.setValue(DEFAULT_VALUE);
      this.plugin.getSettings().iconColor = null;
      // Custom saving to not save the color black in the data.
      await this.plugin.saveIconFolderData();
      helper.refreshStyleOfIcons(this.plugin);
    });

    const colorPicker = new ColorComponent(setting.controlEl)
      .setValue(this.plugin.getSettings().iconColor ?? DEFAULT_VALUE)
      .onChange(async (value) => {
        this.plugin.getSettings().iconColor = value;
        await this.plugin.saveIconFolderData();

        helper.refreshStyleOfIcons(this.plugin);
      });
  }
}
