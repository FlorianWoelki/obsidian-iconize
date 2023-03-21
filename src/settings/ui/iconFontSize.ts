import { Setting } from 'obsidian';
import IconFolderSetting from './iconFolderSetting';
import { DEFAULT_SETTINGS } from '../data';
import style from '@lib/util/style';
import inheritance from '../../lib/inheritance';
import customRule from '../../lib/customRule';

export default class IconFontSizeSetting extends IconFolderSetting {
  public display(): void {
    new Setting(this.containerEl)
      .setName('Icon font size (in pixels)')
      .setDesc('Change the font size of the displayed icons.')
      .addSlider((slider) => {
        slider
          .setLimits(10, 24, 1)
          .setDynamicTooltip()
          .setValue(this.plugin.getSettings().fontSize ?? DEFAULT_SETTINGS.fontSize)
          .onChange(async (val) => {
            this.plugin.getSettings().fontSize = val;
            await this.plugin.saveIconFolderData();

            // Refreshes the icon style for all normally added icons.
            style.refreshAllIcons(this.plugin);

            const fileExplorers = this.plugin.app.workspace.getLeavesOfType('file-explorer');
            for (const fileExplorer of fileExplorers) {
              // Refreshes the icon style for all inheritance folders.
              for (const folderPath of Object.keys(inheritance.getFolders(this.plugin))) {
                // Apply style for the icon node itself.
                const folderItem = fileExplorer.view.fileItems[folderPath];
                if (folderItem) {
                  const titleEl = folderItem.titleEl;
                  const iconNode = titleEl.querySelector('.obsidian-icon-folder-icon') as HTMLElement;
                  iconNode.innerHTML = style.applyAll(this.plugin, iconNode.innerHTML, iconNode);
                }

                // Apply style for all files in this inheritance.
                const files = inheritance.getFiles(this.plugin, folderPath);
                for (const file of files) {
                  const fileItem = fileExplorer.view.fileItems[file.path];
                  const titleEl = fileItem.titleEl;
                  const iconNode = titleEl.querySelector('.obsidian-icon-folder-icon') as HTMLElement;
                  iconNode.innerHTML = style.applyAll(this.plugin, iconNode.innerHTML, iconNode);
                }
              }

              // Refreshes the icon style for all custom icon rules..
              for (const rule of customRule.getSortedRules(this.plugin)) {
                const files = customRule.getFiles(this.plugin, rule);
                for (const file of files) {
                  const fileItem = fileExplorer.view.fileItems[file.path];
                  const titleEl = fileItem.titleEl;
                  const iconNode = titleEl.querySelector('.obsidian-icon-folder-icon') as HTMLElement;
                  iconNode.innerHTML = style.applyAll(this.plugin, iconNode.innerHTML, iconNode);
                }
              }
            }
          });
      });
  }
}
