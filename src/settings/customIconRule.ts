import { App, Notice, Setting, TextComponent, ColorComponent, ButtonComponent, Modal } from 'obsidian';
import IconFolderSetting from './iconFolderSetting';
import IconsPickerModal from '../iconsPickerModal';
import IconFolderPlugin from '../main';
import { getAllOpenedFiles } from '../util';
import { CustomRule } from '../settings-data';
import customRule from '../lib/customRule';
import iconTabs from '../lib/iconTabs';

export default class CustomIconRuleSetting extends IconFolderSetting {
  private app: App;
  private textComponent: TextComponent;
  private chooseIconBtn: ButtonComponent;
  private refreshDisplay: () => void;

  constructor(plugin: IconFolderPlugin, containerEl: HTMLElement, app: App, refreshDisplay: () => void) {
    super(plugin, containerEl);
    this.app = app;
    this.refreshDisplay = refreshDisplay;
  }

  /**
   * Updates all the open files based on the custom rule that was specified.
   * @param rule Rule that will be used to update all the icons for all opened files.
   * @param remove Whether to remove the icons that are applicable to the rule or not.
   */
  private async updateIconTabs(rule: CustomRule, remove: boolean): Promise<void> {
    if (this.plugin.getSettings().iconInTabsEnabled) {
      for (const openedFile of getAllOpenedFiles(this.plugin)) {
        const applicable = await customRule.isApplicable(this.plugin, rule, openedFile);
        if (!applicable) {
          continue;
        }

        if (remove) {
          iconTabs.remove(openedFile, { replaceWithDefaultIcon: true });
        } else {
          iconTabs.add(this.plugin, openedFile, { iconName: rule.icon, iconColor: rule.color });
        }
      }
    }
  }

  public display(): void {
    new Setting(this.containerEl)
      .setName('Add icon rule')
      .setDesc('Will add the icon based on the specific string.')
      .addText((text) => {
        text.onChange((value) => {
          this.chooseIconBtn.setDisabled(value.length === 0);
          this.chooseIconBtn.buttonEl.style.cursor = value.length === 0 ? 'not-allowed' : 'default';
          this.chooseIconBtn.buttonEl.style.opacity = value.length === 0 ? '50%' : '100%';
        });
        text.setPlaceholder('regex or simple string');
        this.textComponent = text;
      })
      .addButton((btn) => {
        btn.setDisabled(true);
        btn.setButtonText('Choose icon');
        btn.buttonEl.style.marginLeft = '12px';
        btn.buttonEl.style.cursor = 'not-allowed';
        btn.buttonEl.style.opacity = '50%';
        btn.onClick(async () => {
          if (this.textComponent.getValue().length === 0) {
            return;
          }

          const modal = new IconsPickerModal(this.app, this.plugin, '');
          modal.onChooseItem = async (item) => {
            let icon = '';
            if (typeof item === 'object') {
              icon = item.displayName;
            } else {
              icon = item;
            }

            const rule: CustomRule = { rule: this.textComponent.getValue(), icon, for: 'everything' };
            this.plugin.getSettings().rules = [...this.plugin.getSettings().rules, rule];
            await this.plugin.saveIconFolderData();

            this.refreshDisplay();
            new Notice('Icon rule added.');
            this.textComponent.setValue('');

            await customRule.addToAllFiles(this.plugin, rule);
            this.updateIconTabs(rule, false);
          };
          modal.open();
        });
        this.chooseIconBtn = btn;
      });

    this.plugin.getSettings().rules.forEach((rule) => {
      const settingRuleEl = new Setting(this.containerEl).setName(rule.rule).setDesc(`Icon: ${rule.icon}`);

      const colorPicker = new ColorComponent(settingRuleEl.controlEl)
        .setValue(rule.color ?? '#000000')
        .onChange(async (value) => {
          rule.color = value;
          await this.plugin.saveIconFolderData();

          customRule.addToAllFiles(this.plugin, rule);
          this.updateIconTabs(rule, false);
        });
      settingRuleEl.components.push(colorPicker);

      // Add the configuration button for configuring where the custom rule gets applied to.
      settingRuleEl.addButton((btn) => {
        const isFor: typeof rule.for = rule.for ?? 'everything';
        if (isFor === 'folders') {
          btn.setIcon('folder');
        } else if (isFor === 'files') {
          btn.setIcon('document');
        } else {
          btn.setIcon('documents');
        }

        btn.setTooltip(`Icon applicable to: ${isFor}`);

        btn.onClick(async () => {
          await customRule.removeFromAllFiles(this.plugin, { ...rule, for: isFor });

          if (isFor === 'folders') {
            rule.for = 'everything';
          } else if (isFor === 'files') {
            rule.for = 'folders';
          } else {
            rule.for = 'files';
          }

          await customRule.addToAllFiles(this.plugin, rule);
          this.updateIconTabs(rule, false);

          await this.plugin.saveIconFolderData();
          this.refreshDisplay();

          this.plugin.getSettings().rules.forEach(async (previousRule) => {
            await customRule.addToAllFiles(this.plugin, previousRule);
            this.updateIconTabs(previousRule, false);
          });
        });
      });

      // Add the edit custom rule button.
      settingRuleEl.addButton((btn) => {
        btn.setIcon('pencil');
        btn.setTooltip('Edit the custom rule');
        btn.onClick(() => {
          // Create modal and its children elements.
          const modal = new Modal(this.plugin.app);
          modal.modalEl.classList.add('obsidian-icon-folder-custom-rule-modal');
          modal.titleEl.createEl('h3', { text: 'Edit custom rule' });
          const input = new TextComponent(modal.contentEl);
          input.setValue(rule.rule);
          const button = new ButtonComponent(modal.contentEl);
          button.setButtonText('Save');
          button.onClick(async () => {
            // Update the rules with new edited rule.
            const newRules = this.plugin.getSettings().rules.map((r) => {
              if (rule.rule === r.rule && rule.color === r.color && rule.icon === r.icon && rule.for === r.for) {
                return { ...r, rule: input.getValue() };
              }
              return r;
            });
            this.plugin.getSettings().rules = newRules;

            await this.plugin.saveIconFolderData();
            this.refreshDisplay();
            new Notice('Custom rule updated.');

            // Refresh the DOM.
            await customRule.removeFromAllFiles(this.plugin, rule);
            this.updateIconTabs(rule, true);
            newRules.forEach(async (rule) => {
              await customRule.addToAllFiles(this.plugin, rule);
              this.updateIconTabs(rule, false);
            });

            modal.close();
          });

          modal.open();
        });
      });

      // Add the delete custom rule button.
      settingRuleEl.addButton((btn) => {
        btn.setIcon('trash');
        btn.setTooltip('Remove the custom rule');
        btn.onClick(async () => {
          const newRules = this.plugin
            .getSettings()
            .rules.filter(
              (r) => rule.rule !== r.rule || rule.color !== r.color || rule.icon !== r.icon || rule.for !== r.for,
            );
          this.plugin.getSettings().rules = newRules;
          await this.plugin.saveIconFolderData();

          this.refreshDisplay();
          new Notice('Custom rule deleted.');

          await customRule.removeFromAllFiles(this.plugin, rule);

          this.updateIconTabs(rule, true);
          const previousRules = this.plugin.getSettings().rules.filter((r) => rule.for === r.for);
          previousRules.forEach(async (previousRule) => {
            await customRule.addToAllFiles(this.plugin, previousRule);
            this.updateIconTabs(previousRule, false);
          });
        });
      });
    });
  }
}
