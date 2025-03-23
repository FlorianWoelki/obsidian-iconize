import { Notice, Setting, TextComponent } from 'obsidian';
import { T } from '../../locales/translations';
import IconFolderSetting from './iconFolderSetting';

export default class IconIdentifierSetting extends IconFolderSetting {
  private textComp: TextComponent;

  public display(): void {
    const setting = new Setting(this.containerEl)
      .setName(T('Icon identifier'))
      .setDesc(T('Change the icon identifier used in notes.'))
      .setClass('iconize-setting');

    setting.addText((text) => {
      this.textComp = text;
      text.setValue(this.plugin.getSettings().iconIdentifier);
    });

    setting.addButton((btn) => {
      btn.setButtonText(T('Save'));
      btn.onClick(async () => {
        const newIdentifier = this.textComp.getValue();
        const oldIdentifier = this.plugin.getSettings().iconIdentifier;

        if (newIdentifier === oldIdentifier) {
          return;
        }

        this.plugin.getSettings().iconIdentifier = newIdentifier;
        await this.plugin.saveIconFolderData();
        new Notice(T('...saved successfully'));
      });
    });
  }
}
