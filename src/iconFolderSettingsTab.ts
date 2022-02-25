import { addIcon, App, DropdownComponent, PluginSettingTab, Setting, SliderComponent } from 'obsidian';
import { ColorPickerComponent } from './colorPickerComponent';
import IconFolderPlugin from './main';
import { DEFAULT_SETTINGS, ExtraPaddingSettings } from './settings';
import { refreshIconStyle } from './util';

export default class IconFolderSettingsTab extends PluginSettingTab {
  plugin: IconFolderPlugin;

  constructor(app: App, plugin: IconFolderPlugin) {
    super(app, plugin);

    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();
    containerEl.createEl('h2', { text: 'Icon Folder Settings' });

    new Setting(containerEl)
      .setName('Recently used Icons limit')
      .setDesc('Change the limit for the recently used icons displayed in the icon modal.')
      .addSlider((slider) => {
        slider
          .setLimits(1, 15, 1)
          .setDynamicTooltip()
          .setValue(this.plugin.getSettings().recentlyUsedIconsSize ?? DEFAULT_SETTINGS.recentlyUsedIconsSize)
          .onChange(async (val) => {
            this.plugin.getSettings().recentlyUsedIconsSize = val;
            await this.plugin.checkRecentlyUsedIcons();
            await this.plugin.saveIconFolderData();
          });
      });

    containerEl.createEl('h3', { text: 'Icon Packs' });

    new Setting(containerEl)
      .setName('Enable Remix Icons (Line)')
      .setDesc('Enables all line variants from the Remix Icon set.')
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.getSettings().enableRemixiconsLine).onChange(async (val) => {
          this.plugin.getSettings().enableRemixiconsLine = val;
          await this.plugin.saveIconFolderData();
        });
      });

    new Setting(containerEl)
      .setName('Enable Remix Icons (Fill)')
      .setDesc('Enables all fill variants from the Remix Icon set.')
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.getSettings().enableRemixiconsFill).onChange(async (val) => {
          this.plugin.getSettings().enableRemixiconsFill = val;
          await this.plugin.saveIconFolderData();
        });
      });

    new Setting(containerEl)
      .setName('Enable Fontawesome Icons (Fill/Solid)')
      .setDesc('Enables all fill/solid variants from the Fontawesome Icon set.')
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.getSettings().enableFontawesomeFill).onChange(async (val) => {
          this.plugin.getSettings().enableFontawesomeFill = val;
          await this.plugin.saveIconFolderData();
        });
      });

    new Setting(containerEl)
      .setName('Enable Fontawesome Icons (Line/Regular)')
      .setDesc('Enables all line variants from the Fontawesome Icon set.')
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.getSettings().enableFontawesomeLine).onChange(async (val) => {
          this.plugin.getSettings().enableFontawesomeLine = val;
          await this.plugin.saveIconFolderData();
        });
      });

    new Setting(containerEl)
      .setName('Enable Fontawesome Icons (Brands)')
      .setDesc('Enables all brands variants from the Fontawesome Icon set.')
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.getSettings().enableFontawesomeBrands).onChange(async (val) => {
          this.plugin.getSettings().enableFontawesomeBrands = val;
          await this.plugin.saveIconFolderData();
        });
      });

    new Setting(containerEl)
      .setName('Enable Devicon Icons')
      .setDesc('Enable all icons from the Devicon Icon set.')
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.getSettings().enableDevicons).onChange(async (val) => {
          this.plugin.getSettings().enableDevicons = val;
          await this.plugin.saveIconFolderData();
        });
      });

    containerEl.createEl('h3', { text: 'Icon Folder Customization' });

    new Setting(containerEl)
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

            refreshIconStyle(this.plugin);
          });
      });

    const colorCustomization = new Setting(containerEl)
      .setName('Icon color')
      .setDesc('Change the color of the displayed icons.');
    const colorPicker = new ColorPickerComponent(colorCustomization.controlEl)
      .setValue(this.plugin.getSettings().iconColor ?? '#000000')
      .onChange(async (value) => {
        this.plugin.getSettings().iconColor = value;
        await this.plugin.saveIconFolderData();

        refreshIconStyle(this.plugin);
      });

    colorCustomization.addButton((button) => {
      button
        .setButtonText('Default')
        .setTooltip('Set color to the default one')
        .onClick(async () => {
          colorPicker.setValue('#000000');
          this.plugin.getSettings().iconColor = null;
          await this.plugin.saveIconFolderData();

          refreshIconStyle(this.plugin);
        });
    });

    colorCustomization.components.push(colorPicker.build());

    const extraPaddingSetting = new Setting(containerEl)
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
