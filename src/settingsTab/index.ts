import { App, PluginSettingTab } from 'obsidian';
import IconFolderPlugin from '../main';
import CustomIconPackSetting from './customIconPack';
import CustomIconRuleSetting from './customIconRule';
import ExtraPaddingSetting from './extraPadding';
import IconColorSetting from './iconColor';
import IconFontSizeSetting from './iconFontSize';
import IconPacksPathSetting from './iconPacksPath';
import PredefinedIconPacksSetting from './predefinedIconPacks';
import RecentlyUsedIconsSetting from './recentlyUsedIcons';

export default class IconFolderSettingsTab extends PluginSettingTab {
  private plugin: IconFolderPlugin;

  constructor(app: App, plugin: IconFolderPlugin) {
    super(app, plugin);

    this.plugin = plugin;
  }

  display(): void {
    const { plugin, containerEl, app } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Icon Folder Settings' });
    new RecentlyUsedIconsSetting(plugin, containerEl).display();
    new IconPacksPathSetting(plugin, containerEl).display();

    containerEl.createEl('h3', { text: 'Icon Packs' });
    new PredefinedIconPacksSetting(plugin, containerEl, app).display();
    new CustomIconPackSetting(plugin, containerEl).display();

    containerEl.createEl('h3', { text: 'Icon Customization' });
    new IconFontSizeSetting(plugin, containerEl).display();
    new IconColorSetting(plugin, containerEl).display();
    new ExtraPaddingSetting(plugin, containerEl).display();

    containerEl.createEl('h3', { text: 'Custom Icon Rules' });
    new CustomIconRuleSetting(plugin, containerEl, app).display();
  }
}
