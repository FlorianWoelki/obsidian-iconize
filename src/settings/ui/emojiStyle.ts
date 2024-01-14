import { Setting } from 'obsidian';
import emoji from '@app/emoji';
import customRule from '@lib/custom-rule';
import dom from '@lib/util/dom';
import { FolderIconObject } from '@app/main';
import iconTabs from '@app/lib/icon-tabs';
import IconFolderSetting from './iconFolderSetting';

export default class EmojiStyleSetting extends IconFolderSetting {
  public display(): void {
    const emojiStyle = new Setting(this.containerEl)
      .setName('Emoji style')
      .setDesc('Change the style of your emojis.');
    emojiStyle.addDropdown((dropdown) => {
      dropdown.addOption('none', 'None');
      dropdown.addOption('native', 'Native');
      dropdown.addOption('twemoji', 'Twemoji');
      dropdown.setValue(this.plugin.getSettings().emojiStyle);
      dropdown.onChange(async (value: 'none' | 'native' | 'twemoji') => {
        this.plugin.getSettings().emojiStyle = value;
        this.updateDOM();
        await this.plugin.saveIconFolderData();
      });
    });
  }

  private updateDOM(): void {
    for (const fileExplorer of this.plugin.getRegisteredFileExplorers()) {
      const fileItems = Object.entries(fileExplorer.fileItems);
      for (const [path, _] of fileItems) {
        let iconName = this.plugin.getData()[path] as string | undefined | null;
        if (!iconName) {
          continue;
        }

        const data = this.plugin.getData()[path];
        if (typeof data === 'object') {
          const data = this.plugin.getData()[path] as FolderIconObject;

          if (data.iconName) {
            iconName = data.iconName;
          }
        }

        if (emoji.isEmoji(iconName)) {
          dom.createIconNode(this.plugin, path, iconName);
          const tabLeaves = iconTabs.getTabLeavesOfFilePath(this.plugin, path);
          for (const tabLeaf of tabLeaves) {
            iconTabs.update(
              this.plugin,
              iconName,
              tabLeaf.tabHeaderInnerIconEl,
            );
          }

          this.plugin.addIconInTitle(iconName);
        }
      }
    }

    for (const rule of customRule.getSortedRules(this.plugin)) {
      customRule.addToAllFiles(this.plugin, rule);
    }
  }
}
