import { Setting, SliderComponent } from 'obsidian';
import IconFolderSetting from './iconFolderSetting';
import { DEFAULT_SETTINGS } from '../data';
import helper from '../helper';
import { ResetButtonComponent } from '../ResetButtonComponent';

const values = {
  min: 10,
  max: 64,
  default: DEFAULT_SETTINGS.fontSize,
  step: 1,
};

export default class IconFontSizeSetting extends IconFolderSetting {
  private slider: SliderComponent;

  public display(): void {
    const setting = new Setting(this.containerEl)
      .setName('Icon font size (in pixels)')
      .setDesc('Change the font size of the displayed icons.');

    new ResetButtonComponent(setting.controlEl).onClick(() => {
      this.slider.setValue(values.default);
    });

    setting.addSlider((slider) => {
      this.slider = slider;
      slider
        .setLimits(values.min, values.max, values.step)
        .setDynamicTooltip()
        .setValue(
          this.plugin.getSettings().fontSize ?? DEFAULT_SETTINGS.fontSize,
        )
        .onChange(async (val) => {
          this.plugin.getSettings().fontSize = val;
          await this.plugin.saveIconFolderData();

          helper.refreshStyleOfIcons(this.plugin);
        });
    });
  }
}
