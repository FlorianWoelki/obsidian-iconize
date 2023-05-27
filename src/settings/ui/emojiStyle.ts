import { Setting, TFile } from 'obsidian';
import emoji from '@app/emoji';
import customRule from '@lib/customRule';
import dom from '@lib/util/dom';
import { FolderIconObject } from '@app/main';
import IconFolderSetting from './iconFolderSetting';
import inheritance from '../../lib/inheritance';
import iconTabs from '../../lib/iconTabs';
import { getAllOpenedFiles } from '../../util';

export default class EmojiStyleSetting extends IconFolderSetting {
  public display(): void {
    const emojiStyle = new Setting(this.containerEl).setName('Emoji Style').setDesc('Change the style of your emojis.');
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
    const openFiles = getAllOpenedFiles(this.plugin);
    for (const fileExplorer of this.plugin.getRegisteredFileExplorers()) {
      const fileItems = Object.entries(fileExplorer.fileItems);
      for (const [path, fileItem] of fileItems) {
        let iconName = this.plugin.getData()[path] as string | undefined | null;
        if (!iconName) {
          continue;
        }

        if (typeof this.plugin.getData()[path] === 'object') {
          const inheritanceData = this.plugin.getData()[path] as FolderIconObject;
          iconName = inheritanceData.iconName;

          // Handle updating the emoji style for the inheritance icon.
          if (emoji.isEmoji(inheritanceData.inheritanceIcon)) {
            for (const file of inheritance.getFiles(this.plugin, path)) {
              dom.createIconNode(this.plugin, file.path, inheritanceData.inheritanceIcon);
              iconTabs.update(this.plugin, file as TFile, inheritanceData.inheritanceIcon);
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
          iconTabs.update(this.plugin, fileItem.file as TFile, iconName);
        }
      }
    }

    customRule.addAll(this.plugin);
  }
}
