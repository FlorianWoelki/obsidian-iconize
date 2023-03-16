import { Setting } from 'obsidian';
import emoji from '../emoji';
import customRule from '../lib/customRule';
import dom from '../lib/util/dom';
import { FolderIconObject } from '../main';
import IconFolderSetting from './iconFolderSetting';

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
    for (const fileExplorer of this.plugin.getRegisteredFileExplorers()) {
      const paths = Object.keys(fileExplorer.fileItems);
      for (const path of paths) {
        let iconName = this.plugin.getData()[path] as string;
        if (typeof this.plugin.getData()[path] === 'object') {
          iconName = (this.plugin.getData()[path] as FolderIconObject).iconName;
        }

        if (emoji.isEmoji(iconName)) {
          dom.createIconNode(this.plugin, path, iconName);
        }
      }
    }

    customRule.addAll(this.plugin);
  }
}
