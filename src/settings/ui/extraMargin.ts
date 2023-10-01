import { DropdownComponent, Setting, SliderComponent } from 'obsidian';
import IconFolderSetting from './iconFolderSetting';
import { ExtraMarginSettings } from '../data';
import helper from '../helper';

export default class ExtraMarginSetting extends IconFolderSetting {
  public display(): void {
    const extraMarginSetting = new Setting(this.containerEl)
      .setName('Extra margin (in pixels)')
      .setDesc('Change the margin of the icons.')
      .setClass('obsidian-icon-folder-setting');

    const extraMarginDropdown = new DropdownComponent(
      extraMarginSetting.controlEl,
    ).addOptions({
      top: 'Top',
      right: 'Right',
      bottom: 'Bottom',
      left: 'Left',
    } as Record<keyof ExtraMarginSettings, string>);

    const extraMarginSlider = new SliderComponent(extraMarginSetting.controlEl)
      .setLimits(-24, 24, 1)
      .setDynamicTooltip()
      .setValue(this.plugin.getSettings().extraMargin?.top ?? 2)
      .onChange(async (val) => {
        const dropdownValue =
          extraMarginDropdown.getValue() as keyof ExtraMarginSettings;
        if (this.plugin.getSettings().extraMargin) {
          this.plugin.getSettings().extraMargin[dropdownValue] = val;
        } else {
          this.plugin.getSettings().extraMargin = {
            [dropdownValue]: val,
          };
        }
        await this.plugin.saveIconFolderData();
        helper.refreshStyleOfIcons(this.plugin);
      });

    extraMarginDropdown.onChange((val: keyof ExtraMarginSettings) => {
      if (this.plugin.getSettings().extraMargin) {
        extraMarginSlider.setValue(
          this.plugin.getSettings().extraMargin[val] ?? 2,
        );
      } else {
        extraMarginSlider.setValue(2);
      }
    });

    extraMarginSetting.components.push(extraMarginDropdown, extraMarginSlider);
  }
}
