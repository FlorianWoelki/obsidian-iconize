import { App, PluginSettingTab, Setting } from 'obsidian';
import IconFolderPlugin from './main';

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

    containerEl.createEl('h3', { text: 'Icon Folder Customization' });

    new Setting(containerEl)
      .setName('Icon font size (in pixels)')
      .setDesc('Change the font size of the displayed icons.')
      .addSlider((slider) => {
        slider
          .setLimits(10, 24, 1)
          .setValue(this.plugin.getSettings().fontSize)
          .onChange(async (val) => {
            slider.showTooltip();
            this.plugin.getSettings().fontSize = val;
            await this.plugin.saveIconFolderData();
          });
        slider.showTooltip();
      });
  }
}
