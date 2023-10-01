import { App, PluginSettingTab } from 'obsidian';
import IconFolderPlugin from '../../main';
import CustomIconPackSetting from './customIconPack';
import CustomIconRuleSetting from './customIconRule';
import EmojiStyleSetting from './emojiStyle';
import ExtraMarginSetting from './extraMargin';
import IconColorSetting from './iconColor';
import IconFontSizeSetting from './iconFontSize';
import IconPacksPathSetting from './iconPacksPath';
import PredefinedIconPacksSetting from './predefinedIconPacks';
import RecentlyUsedIconsSetting from './recentlyUsedIcons';
import ToggleIconInTabs from './toggleIconInTabs';

export default class IconFolderSettings extends PluginSettingTab {
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
    new EmojiStyleSetting(plugin, containerEl).display();
    new ToggleIconInTabs(plugin, containerEl).display();

    containerEl.createEl('h3', { text: 'Icon Packs' });
    new PredefinedIconPacksSetting(plugin, containerEl, app, () =>
      this.display(),
    ).display();
    new CustomIconPackSetting(plugin, containerEl, () =>
      this.display(),
    ).display();

    containerEl.createEl('h3', { text: 'Icon Customization' });
    new IconFontSizeSetting(plugin, containerEl).display();
    new IconColorSetting(plugin, containerEl).display();
    new ExtraMarginSetting(plugin, containerEl).display();

    containerEl.createEl('h3', { text: 'Custom Icon Rules' });
    new CustomIconRuleSetting(plugin, containerEl, app, () =>
      this.display(),
    ).display();
  }
}
