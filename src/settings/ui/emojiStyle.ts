import { Setting } from 'obsidian';
import emoji from '@app/emoji';
import customRule from '@lib/custom-rule';
import dom from '@lib/util/dom';
import { FolderIconObject } from '@app/main';
import IconFolderSetting from './iconFolderSetting';
import inheritance from '../../lib/inheritance';
import iconTabs from '../../lib/icon-tabs';

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

        if (typeof this.plugin.getData()[path] === 'object') {
          const inheritanceData = this.plugin.getData()[
            path
          ] as FolderIconObject;
          iconName = inheritanceData.iconName;

          // Handle updating the emoji style for the inheritance icon.
          if (emoji.isEmoji(inheritanceData.inheritanceIcon)) {
            for (const file of inheritance.getFiles(this.plugin, path)) {
              dom.createIconNode(
                this.plugin,
                file.path,
                inheritanceData.inheritanceIcon,
              );
              const tabLeaves = iconTabs.getTabLeavesOfFilePath(
                this.plugin,
                file.path,
              );
              for (const tabLeaf of tabLeaves) {
                iconTabs.update(
                  this.plugin,
                  inheritanceData.inheritanceIcon,
                  tabLeaf.tabHeaderInnerIconEl,
                );
              }
            }
          }
        }

        // `iconName` is `null` indicates that for the inheritance object the icon name
        // on the node itself does not exist.
        if (!iconName) {
          continue;
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
        }
      }
    }

    for (const rule of customRule.getSortedRules(this.plugin)) {
      customRule.addToAllFiles(this.plugin, rule);
    }
  }
}
