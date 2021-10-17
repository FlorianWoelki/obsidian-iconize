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
      .setName('Enable Remix Icon (Line)')
      .setDesc('Enables all line variants from the Remix Icon set')
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.getSettings().enableRemixiconsLine).onChange(async (val) => {
          this.plugin.getSettings().enableRemixiconsLine = val;
          await this.plugin.saveIconFolderData();
        });
      });

    new Setting(containerEl)
      .setName('Enable Remix Icon (Fill)')
      .setDesc('Enables all fill variants from the Remix Icon set')
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.getSettings().enableRemixiconsFill).onChange(async (val) => {
          this.plugin.getSettings().enableRemixiconsFill = val;
          await this.plugin.saveIconFolderData();
        });
      });
  }
}
