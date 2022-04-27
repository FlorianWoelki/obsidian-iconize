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
      text.setValue(`.obsidian/${this.plugin.getSettings().iconPacksPath}`);
      text.onChange((value) => {
        if (!value.startsWith('.obsidian/')) {
          text.setValue(`.obsidian/`);
        }
      });
    });

    iconPacksPathSetting.addButton((btn) => {
      btn.setButtonText('Save');
      btn.buttonEl.style.marginLeft = '12px';
      btn.onClick(async () => {
        const splittedPath = this.iconPacksSettingTextComp.getValue().split('.obsidian/');
        if (splittedPath.length === 0) {
          return;
        }

        const newPath = splittedPath[1];

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
