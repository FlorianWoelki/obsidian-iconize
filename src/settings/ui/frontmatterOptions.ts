import { Setting, TextComponent } from 'obsidian';
import IconFolderSetting from './iconFolderSetting';
import { Notice } from 'obsidian';
import config from '@app/config';
import { isHexadecimal, stringToHex } from '@app/util';
import { logger } from '@app/lib/logger';

export default class FrontmatterOptions extends IconFolderSetting {
  private iconFieldNameTextComp: TextComponent;
  private iconColorFieldNameTextComp: TextComponent;

  public display(): void {
    

    new Setting(this.containerEl)
      .setName('Frontmatter icon field name')
      .setDesc(
        'Sets the name of the frontmatter field which contains the icon.',
      )
      .addText((text) => {
        this.iconFieldNameTextComp = text;
        text.setValue(this.plugin.getSettings().iconInFrontmatterFieldName);
      })
      .addButton((button) => {
        button.setButtonText('Save');
        button.onClick(async () => {
          const newValue = this.iconFieldNameTextComp.getValue();
          const oldValue = this.plugin.getSettings().iconInFrontmatterFieldName;

          if (newValue === oldValue) {
            return;
          }

          this.plugin.getSettings().iconInFrontmatterFieldName = newValue;
          await this.plugin.saveIconFolderData();
          new Notice('...saved successfully');
        });
      });

    new Setting(this.containerEl)
      .setName('Frontmatter icon color field name')
      .setDesc(
        'Sets the name of the frontmatter field which contains the icon color.',
      )
      .addText((text) => {
        this.iconColorFieldNameTextComp = text;
        text.setValue(
          this.plugin.getSettings().iconColorInFrontmatterFieldName,
        );
      })
      .addButton((button) => {
        button.setButtonText('Save');
        button.onClick(async () => {
          const newValue = this.iconColorFieldNameTextComp.getValue();
          const oldValue =
            this.plugin.getSettings().iconColorInFrontmatterFieldName;

          if (newValue === oldValue) {
            return;
          }

          this.plugin.getSettings().iconColorInFrontmatterFieldName = newValue;
          await this.plugin.saveIconFolderData();
          new Notice('...saved successfully');
        });
      });

    new Setting(this.containerEl)
      .setName('Refresh icons from frontmatter')
      .setDesc(
        'Sets the icon and color for each note in the vault based on the frontmatter properties. WARNING: This will change any manually set icons to the one defined in the frontmatter. IF A NOTE HAS NO FRONTMATTER, THE CURRENT ICON WILL BE REMOVED. Please restart Obsidian after this completes to see the changes.',
      )
      .addButton((btn) => {
        btn.setButtonText('Refresh').onClick(async () => {
          new Notice(
            `[${config.PLUGIN_NAME}] Refreshing icons from frontmatter, please wait...`,
          );

          const files = this.plugin.app.vault.getMarkdownFiles();

          for (const file of files) {
            const fileCache = this.plugin.app.metadataCache.getFileCache(file);

            const frontmatterIconKey =
              this.plugin.getSettings().iconInFrontmatterFieldName;
            const frontmatterIconColorKey =
              this.plugin.getSettings().iconColorInFrontmatterFieldName;

            const iconName = fileCache.frontmatter?.[frontmatterIconKey];
            let iconColor = fileCache.frontmatter?.[frontmatterIconColorKey];

            if (!iconName) {
              await this.plugin.removeFolderIcon(file.path);
              continue;
            }

            if (typeof iconName !== 'string') {
              const message = `${file.path}\nFrontmatter property type \`${frontmatterIconKey}\` has to be of type \`text\`.`;
              logger.warn(message);
              new Notice(`[${config.PLUGIN_NAME}]\n${message}`);
              continue;
            }

            this.plugin.addFolderIcon(file.path, iconName);

            if (!iconColor) {
              await this.plugin.removeIconColor(file.path);
              continue;
            }

            if (typeof iconColor !== 'string') {
              const message = `${file.path}\nFrontmatter property type \`${frontmatterIconColorKey}\` has to be of type \`text\`.`;
              logger.warn(message);
              new Notice(`[${config.PLUGIN_NAME}]\n${message}`);
              continue;
            }

            iconColor = isHexadecimal(iconColor)
              ? stringToHex(iconColor)
              : iconColor;

            this.plugin.addIconColor(file.path, iconColor);
          }
          new Notice(
            `[${config.PLUGIN_NAME}] Refreshed icons from frontmatter. Please restart Obsidian to see the changes.`,
          );
        });
      });
  }
}
