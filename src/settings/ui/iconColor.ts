import { Setting, ColorComponent } from 'obsidian';
import IconFolderSetting from './iconFolderSetting';
import style from '../../lib/util/style';

export default class IconColorSetting extends IconFolderSetting {
  public display(): void {
    const colorCustomization = new Setting(this.containerEl)
      .setName('Icon color')
      .setDesc('Change the color of the displayed icons.');
    const colorPicker = new ColorComponent(colorCustomization.controlEl)
      .setValue(this.plugin.getSettings().iconColor ?? '#000000')
      .onChange(async (value) => {
        this.plugin.getSettings().iconColor = value;
        await this.plugin.saveIconFolderData();

        style.refreshAllIcons(this.plugin);
      });

    colorCustomization.addButton((button) => {
      button
        .setButtonText('Default')
        .setTooltip('Set color to the default one')
        .onClick(async () => {
          colorPicker.setValue('#000000');
          this.plugin.getSettings().iconColor = null;
          await this.plugin.saveIconFolderData();

          style.refreshAllIcons(this.plugin);
        });
    });

    colorCustomization.components.push(colorPicker);
  }
}
