import { MarkdownView, Setting } from 'obsidian';
import emoji from '@app/emoji';
import customRule from '@lib/custom-rule';
import dom from '@lib/util/dom';
import { FolderIconObject } from '@app/main';
import iconTabs from '@app/lib/icon-tabs';
import IconFolderSetting from './iconFolderSetting';
import titleIcon from '@app/lib/icon-title';
import { getAllOpenedFiles } from '@app/util';
import { InlineTitleView } from '@app/@types/obsidian';
import { calculateInlineTitleSize } from '@app/lib/util/text';

export default class EmojiStyleSetting extends IconFolderSetting {
  public display(): void {
    const emojiStyle = new Setting(this.containerEl)
      .setName('Emoji style')
      .setDesc('Change the style of your emojis.');
    emojiStyle.addDropdown((dropdown) => {
      dropdown.addOption('native', 'Native');
      dropdown.addOption('twemoji', 'Twemoji');
      dropdown.setValue(this.plugin.getSettings().emojiStyle);
      dropdown.onChange(async (value: 'native' | 'twemoji') => {
        this.plugin.getSettings().emojiStyle = value;
        this.updateDOM();
        await this.plugin.saveIconFolderData();
      });
    });
  }

  private updateDOM(): void {
    for (const fileExplorer of this.plugin.getRegisteredFileExplorers()) {
      const fileItems = Object.entries(fileExplorer.fileItems || {});
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
          if (this.plugin.getSettings().iconInTabsEnabled) {
            const tabLeaves = iconTabs.getTabLeavesOfFilePath(
              this.plugin,
              path,
            );
            for (const tabLeaf of tabLeaves) {
              iconTabs.update(
                this.plugin,
                iconName,
                tabLeaf.tabHeaderInnerIconEl,
              );
            }
          }

          if (this.plugin.getSettings().iconInTitleEnabled) {
            for (const openedFile of getAllOpenedFiles(this.plugin)) {
              const activeView = openedFile.leaf.view as InlineTitleView;
              if (
                activeView instanceof MarkdownView &&
                openedFile.path === path
              ) {
                titleIcon.add(this.plugin, activeView.inlineTitleEl, iconName, {
                  fontSize: calculateInlineTitleSize(),
                });
              }
            }
          }
        }
      }
    }

    for (const rule of customRule.getSortedRules(this.plugin)) {
      customRule.addToAllFiles(this.plugin, rule);
    }
  }
}
