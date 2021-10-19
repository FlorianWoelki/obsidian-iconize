import { App, PluginSettingTab, Setting } from 'obsidian';
import IconFolderPlugin from './main';

export default class IconFolderSettingsTab extends PluginSettingTab {
  plugin: IconFolderPlugin;

  constructor(app: App, plugin: IconFolderPlugin) {
    super(app, plugin);

    this.plugin = plugin;
  }

  display(): void {
    let { containerEl } = this;

    containerEl.empty();
    containerEl.createEl('h2', { text: 'Icon Folder Settings' });

    new Setting(containerEl)
      .setName('Enable Remix Icons (Line)')
      .setDesc('Enables all line variants from the Remix Icon set')
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.getSettings().enableRemixiconsLine).onChange(async (val) => {
          this.plugin.getSettings().enableRemixiconsLine = val;
          await this.plugin.saveIconFolderData();
        });
      });

    new Setting(containerEl)
      .setName('Enable Remix Icons (Fill)')
      .setDesc('Enables all fill variants from the Remix Icon set')
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.getSettings().enableRemixiconsFill).onChange(async (val) => {
          this.plugin.getSettings().enableRemixiconsFill = val;
          await this.plugin.saveIconFolderData();
        });
      });

    new Setting(containerEl)
      .setName('Enable Fontawesome Icons (Fill/Solid)')
      .setDesc('Enables all fill/solid variants from the Fontawesome Icon set')
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.getSettings().enableFontawesomeFill).onChange(async (val) => {
          this.plugin.getSettings().enableFontawesomeFill = val;
          await this.plugin.saveIconFolderData();
        });
      });

    new Setting(containerEl)
      .setName('Enable Fontawesome Icons (Line/Regular)')
      .setDesc('Enables all line variants from the Fontawesome Icon set')
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.getSettings().enableFontawesomeLine).onChange(async (val) => {
          this.plugin.getSettings().enableFontawesomeLine = val;
          await this.plugin.saveIconFolderData();
        });
      });

    new Setting(containerEl)
      .setName('Enable Fontawesome Icons (Brands)')
      .setDesc('Enables all brands variants from the Fontawesome Icon set')
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.getSettings().enableFontawesomeBrands).onChange(async (val) => {
          this.plugin.getSettings().enableFontawesomeBrands = val;
          await this.plugin.saveIconFolderData();
        });
      });
  }
}
