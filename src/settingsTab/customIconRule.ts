import { App, Notice, Setting, TextComponent } from 'obsidian';
import IconFolderSetting from './iconFolderSetting';
import { ColorPickerComponent } from '../colorPickerComponent';
import IconsPickerModal from '../iconsPickerModal';
import IconFolderPlugin from '../main';
import { addCustomRuleIconsToDOM, colorizeCustomRuleIcons, removeCustomRuleIconsFromDOM } from '../util';
import { CustomRule } from '../settings';

export default class CustomIconRuleSetting extends IconFolderSetting {
  private app: App;
  private textComponent: TextComponent;
  private refreshDisplay: () => void;

  constructor(plugin: IconFolderPlugin, containerEl: HTMLElement, app: App, refreshDisplay: () => void) {
    super(plugin, containerEl);
    this.app = app;
    this.refreshDisplay = refreshDisplay;
  }

  public display(): void {
    new Setting(this.containerEl)
      .setName('Add icon rule')
      .setDesc('Will add the icon based on the specific string.')
      .addText((text) => {
        text.setPlaceholder('regex or simple string');
        this.textComponent = text;
      })
      .addButton((btn) => {
        btn.setButtonText('Choose icon');
        btn.buttonEl.style.marginLeft = '12px';
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

            await addCustomRuleIconsToDOM(this.plugin, rule);
          };
          modal.open();
        });
      });

    this.plugin.getSettings().rules.forEach((rule) => {
      const settingRuleEl = new Setting(this.containerEl).setName(rule.rule).setDesc(`Icon: ${rule.icon}`);

      const colorPicker = new ColorPickerComponent(settingRuleEl.controlEl)
        .setValue(rule.color ?? '#000000')
        .onChange(async (value) => {
          rule.color = value;
          await this.plugin.saveIconFolderData();

          colorizeCustomRuleIcons(this.plugin, rule);
        });
      settingRuleEl.components.push(colorPicker);

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
          removeCustomRuleIconsFromDOM(this.plugin, { ...rule, for: isFor });

          if (isFor === 'folders') {
            rule.for = 'everything';
          } else if (isFor === 'files') {
            rule.for = 'folders';
          } else {
            rule.for = 'files';
          }

          await addCustomRuleIconsToDOM(this.plugin, rule);

          await this.plugin.saveIconFolderData();
          this.refreshDisplay();

          this.plugin.getSettings().rules.forEach(async (previousRule) => {
            await addCustomRuleIconsToDOM(this.plugin, previousRule);
          });
        });
      });

      settingRuleEl.addButton((btn) => {
        btn.setIcon('trash');
        btn.setTooltip('Remove the custom rule');
        btn.onClick(async () => {
          const newRules = this.plugin
            .getSettings()
            .rules.filter(
              (r) => rule.rule !== r.rule || rule.color !== r.color || rule.icon !== r.icon || r.for !== r.for,
            );
          this.plugin.getSettings().rules = newRules;
          await this.plugin.saveIconFolderData();

          this.refreshDisplay();
          new Notice('Custom rule deleted.');

          removeCustomRuleIconsFromDOM(this.plugin, rule);
          const previousRules = this.plugin.getSettings().rules.filter((r) => rule.for === r.for);
          previousRules.forEach(async (previousRule) => {
            await addCustomRuleIconsToDOM(this.plugin, previousRule);
          });
        });
      });
    });
  }
}
