import { Setting, TextComponent } from 'obsidian';
import IconFolderSetting from './iconFolderSetting';
import { Notice } from 'obsidian';

export default class FrontmatterOptions extends IconFolderSetting {
  private iconFieldNameTextComp: TextComponent;
  private iconColorFieldNameTextComp: TextComponent;

  public display(): void {
    new Setting(this.containerEl)
      .setName('Use icon in frontmatter')
      .setDesc(
        'Toggles whether to set the icon based on the frontmatter property `icon`.',
      )
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.getSettings().iconInFrontmatterEnabled)
          .onChange(async (enabled) => {
            this.plugin.getSettings().iconInFrontmatterEnabled = enabled;
            await this.plugin.saveIconFolderData();
          });
      });

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
  }
}
