import { Setting, TextComponent } from 'obsidian';
import IconFolderSetting from './iconFolderSetting';
import { createDefaultDirectory, getPath, moveIconPackDirectories, setPath } from '../iconPackManager';

export default class IconPacksPathSetting extends IconFolderSetting {
  private iconPacksSettingTextComp: TextComponent;

  public display(): void {
    const iconPacksPathSetting = new Setting(this.containerEl)
      .setName('Icon Packs folder path')
      .setDesc('Change the default icon packs folder path');

    iconPacksPathSetting.addText((text) => {
      this.iconPacksSettingTextComp = text;
      text.setValue(this.plugin.getSettings().iconPacksPath);
    });

    iconPacksPathSetting.addButton((btn) => {
      btn.setButtonText('Save');
      btn.buttonEl.style.marginLeft = '12px';
      btn.onClick(async () => {
        const newPath = this.iconPacksSettingTextComp.getValue();

        if (getPath() === this.iconPacksSettingTextComp.getValue()) {
          return;
        }

        const oldPath = getPath();
        setPath(newPath);
        await createDefaultDirectory(this.plugin);
        await moveIconPackDirectories(this.plugin, oldPath, getPath());

        this.plugin.getSettings().iconPacksPath = newPath;
        await this.plugin.saveIconFolderData();
      });
    });
  }
}
