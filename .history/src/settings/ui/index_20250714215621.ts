import { App, PluginSettingTab } from 'obsidian';
import IconizePlugin from '@app/main';
import CustomIconPackSetting from './customIconPack';
import CustomIconRuleSetting from './customIconRule';
import EmojiStyleSetting from './emojiStyle';
import ExtraMarginSetting from './extraMargin';
import IconColorSetting from './iconColor';
import IconFontSizeSetting from './iconFontSize';
import IconPacksPathSetting from './iconPacksPath';
import IconPacksBackgroundChecker from './iconPacksBackgroundChecker';
import PredefinedIconPacksSetting from './predefinedIconPacks';
import RecentlyUsedIconsSetting from './recentlyUsedIcons';
import ToggleIconInTabs from './toggleIconInTabs';
import ToggleIconInTitle from './toggleIconInTitle';
import FrontmatterOptions from './frontmatterOptions';
import ToggleIconsInNotes from './toggleIconsInNotes';
import ToggleIconsInLinks from './toggleIconsInLinks';
import IconIdentifierSetting from './iconIdentifier';
import DebugMode from './debugMode';
import UseInternalPlugins from './useInternalPlugins';

export default class IconFolderSettings extends PluginSettingTab {
  private plugin: IconizePlugin;

  constructor(app: App, plugin: IconizePlugin) {
    super(app, plugin);

    this.plugin = plugin;
  }

  display(): void {
    const { plugin, containerEl, app } = this;
    containerEl.empty();

    containerEl.createEl('h1', { text: 'General' });
    new RecentlyUsedIconsSetting(plugin, containerEl).display();
    new IconPacksPathSetting(plugin, containerEl).display();
    new IconPacksBackgroundChecker(plugin, containerEl).display();
    new EmojiStyleSetting(plugin, containerEl).display();
    new IconIdentifierSetting(plugin, containerEl).display();
    new UseInternalPlugins(plugin, containerEl).display();
    new DebugMode(plugin, containerEl).display();

    containerEl.createEl('h3', { text: 'Visibility of icons' });
    new ToggleIconInTabs(plugin, containerEl).display();
    new ToggleIconInTitle(plugin, containerEl).display();
    new FrontmatterOptions(plugin, containerEl).display();
    new ToggleIconsInNotes(plugin, containerEl).display();
    new ToggleIconsInLinks(plugin, containerEl).display();

    containerEl.createEl('h1', {
      text: 'Icon customization for files/folders',
    });
    new IconFontSizeSetting(plugin, containerEl).display();
    new IconColorSetting(plugin, containerEl).display();
    new ExtraMarginSetting(plugin, containerEl).display();

    containerEl.createEl('h1', { text: 'Custom icon rules' });
    new CustomIconRuleSetting(plugin, containerEl, app, () =>
      this.display(),
    ).display();

    containerEl.createEl('h1', { text: 'Icon packs' });
    new PredefinedIconPacksSetting(plugin, containerEl, app, () =>
      this.display(),
    ).display();
    new CustomIconPackSetting(plugin, containerEl, () =>
      this.display(),
    ).display();
  }
}
