import { Setting } from 'obsidian';
import { updateEmojiIconsInDOM } from '../util';
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
        updateEmojiIconsInDOM(this.plugin);
        await this.plugin.saveIconFolderData();
      });
    });
  }
}
