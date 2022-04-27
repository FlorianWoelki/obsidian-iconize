import { DropdownComponent, Setting, SliderComponent } from 'obsidian';
import IconFolderSetting from './iconFolderSetting';
import { ExtraPaddingSettings } from '../settings';
import { refreshIconStyle } from '../util';

export default class ExtraPaddingSetting extends IconFolderSetting {
  public display(): void {
    const extraPaddingSetting = new Setting(this.containerEl)
      .setName('Top Extrapadding (in pixels)')
      .setDesc('Change the top padding of the icons.')
      .setClass('obsidian-icon-folder-setting');
    const extraPaddingDropdown = new DropdownComponent(extraPaddingSetting.controlEl).addOptions({
      top: 'Top',
      right: 'Right',
      bottom: 'Bottom',
      left: 'Left',
    } as Record<keyof ExtraPaddingSettings, string>);
    const extraPaddingSlider = new SliderComponent(extraPaddingSetting.controlEl)
      .setLimits(0, 24, 1)
      .setDynamicTooltip()
      .setValue(this.plugin.getSettings().extraPadding?.top ?? 2)
      .onChange(async (val) => {
        const dropdownValue = extraPaddingDropdown.getValue() as keyof ExtraPaddingSettings;
        if (this.plugin.getSettings().extraPadding) {
          this.plugin.getSettings().extraPadding[dropdownValue] = val;
        } else {
          this.plugin.getSettings().extraPadding = {
            [dropdownValue]: val,
          };
        }
        await this.plugin.saveIconFolderData();

        refreshIconStyle(this.plugin);
      });
    extraPaddingDropdown.onChange((val: keyof ExtraPaddingSettings) => {
      if (this.plugin.getSettings().extraPadding) {
        extraPaddingSlider.setValue(this.plugin.getSettings().extraPadding[val] ?? 2);
      } else {
        extraPaddingSlider.setValue(2);
      }
    });
    extraPaddingSetting.components.push(extraPaddingDropdown, extraPaddingSlider);
  }
}
