import {
  App,
  Notice,
  Setting,
  TextComponent,
  ColorComponent,
  ButtonComponent,
  Modal,
  DropdownComponent,
} from 'obsidian';
import IconFolderSetting from './iconFolderSetting';
import IconsPickerModal from '@app/ui/icons-picker-modal';
import IconizePlugin from '@app/main';
import { saveIconToIconPack } from '@app/util';
import { FrontmatterRule, FrontmatterRuleCriterion, FrontmatterRuleOperator } from '../data';
import emoji from '@app/emoji';
import { getNormalizedName } from '@app/icon-pack-manager/util';

export default class FrontmatterIconRuleSetting extends IconFolderSetting {
  private app: App;
  private refreshDisplay: () => void;

  constructor(
    plugin: IconizePlugin,
    containerEl: HTMLElement,
    app: App,
    refreshDisplay: () => void,
  ) {
    super(plugin, containerEl);
    this.app = app;
    this.refreshDisplay = refreshDisplay;
  }

  private createDescriptionEl(container: HTMLElement, text: string): void {
    const description = container.createEl('p', {
      text,
      cls: 'setting-item-description',
    });
    description.style.marginBottom = 'var(--size-2-2)';
  }

  public display(): void {
    // Toggle for enabling frontmatter rules
    new Setting(this.containerEl)
      .setName('Enable automatic frontmatter-based icon rules')
      .setDesc(
        'Automatically manage icons based on frontmatter properties like quality scores.',
      )
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.getSettings().frontmatterRulesEnabled)
          .onChange(async (enabled) => {
            this.plugin.getSettings().frontmatterRulesEnabled = enabled;
            await this.plugin.saveIconFolderData();
            this.refreshDisplay();
          });
      });

    if (!this.plugin.getSettings().frontmatterRulesEnabled) {
      return;
    }

    // Add new rule section
    this.addNewRuleSection();

    // Display existing rules
    this.displayExistingRules();
  }

  private addNewRuleSection(): void {
    const addRuleContainer = this.containerEl.createDiv();
    addRuleContainer.style.marginTop = '20px';
    addRuleContainer.style.padding = '15px';
    addRuleContainer.style.border = '1px solid var(--background-modifier-border)';
    addRuleContainer.style.borderRadius = '5px';

    const heading = addRuleContainer.createEl('h4', { text: 'Add New Frontmatter Rule' });
    heading.style.marginTop = '0';

    let ruleName = '';
    let ruleIcon = '';
    let ruleColor = '';
    let ruleFor: 'files' | 'folders' | 'everything' = 'files';
    let ruleField = '';
    let ruleOperator: FrontmatterRuleOperator = 'equals';
    let ruleValue = '';

    // Rule name
    new Setting(addRuleContainer)
      .setName('Rule name')
      .setDesc('A descriptive name for this rule')
      .addText((text) => {
        text.setPlaceholder('e.g., "High Quality Notes"');
        text.onChange((value) => {
          ruleName = value;
        });
      });

    // Target files/folders
    new Setting(addRuleContainer)
      .setName('Apply to')
      .setDesc('What type of items this rule should apply to')
      .addDropdown((dropdown) => {
        dropdown
          .addOption('files', 'Files only')
          .addOption('folders', 'Folders only')
          .addOption('everything', 'Files and folders')
          .setValue('files')
          .onChange((value) => {
            ruleFor = value as 'files' | 'folders' | 'everything';
          });
      });

    // Frontmatter field
    new Setting(addRuleContainer)
      .setName('Frontmatter field')
      .setDesc('The frontmatter property to check (e.g., "quality", "rating")')
      .addText((text) => {
        text.setPlaceholder('quality');
        text.onChange((value) => {
          ruleField = value;
        });
      });

    // Operator
    new Setting(addRuleContainer)
      .setName('Condition')
      .setDesc('How to compare the frontmatter value')
      .addDropdown((dropdown) => {
        dropdown
          .addOption('equals', 'equals')
          .addOption('not-equals', 'not equals')
          .addOption('greater-than', 'greater than')
          .addOption('greater-equal', 'greater than or equal')
          .addOption('less-than', 'less than')
          .addOption('less-equal', 'less than or equal')
          .addOption('contains', 'contains')
          .addOption('not-contains', 'does not contain')
          .addOption('exists', 'exists')
          .addOption('not-exists', 'does not exist')
          .setValue('equals')
          .onChange((value) => {
            ruleOperator = value as FrontmatterRuleOperator;
          });
      });

    // Value (not needed for exists/not-exists)
    new Setting(addRuleContainer)
      .setName('Value')
      .setDesc('The value to compare against (not needed for "exists" or "does not exist")')
      .addText((text) => {
        text.setPlaceholder('8');
        text.onChange((value) => {
          ruleValue = value;
        });
      });

    // Icon selection
    let chooseIconBtn: ButtonComponent;
    new Setting(addRuleContainer)
      .setName('Icon')
      .setDesc('Choose the icon to apply when the condition is met')
      .addButton((btn) => {
        chooseIconBtn = btn;
        btn.setButtonText('Choose icon');
        btn.onClick(async () => {
          const modal = new IconsPickerModal(this.app, this.plugin, '');
          modal.onChooseItem = async (item) => {
            const icon = getNormalizedName(
              typeof item === 'object' ? item.displayName : item,
            );
            ruleIcon = icon;
            btn.setButtonText(`Icon: ${icon}`);
          };
          modal.open();
        });
      });

    // Color selection (optional)
    new Setting(addRuleContainer)
      .setName('Icon color (optional)')
      .setDesc('Choose a custom color for the icon')
      .addColorPicker((color) => {
        color.onChange((value) => {
          ruleColor = value;
        });
      });

    // Add rule button
    new Setting(addRuleContainer)
      .addButton((btn) => {
        btn.setButtonText('Add Rule');
        btn.setCta();
        btn.onClick(async () => {
          if (!ruleName || !ruleField || !ruleIcon) {
            new Notice('Please fill in rule name, field, and choose an icon.');
            return;
          }

          // Convert value to appropriate type
          let convertedValue: string | number | boolean | undefined = ruleValue;
          if (ruleOperator !== 'exists' && ruleOperator !== 'not-exists') {
            if (ruleValue === '') {
              new Notice('Please provide a value for the condition.');
              return;
            }
            
            // Try to convert to number if it looks like a number
            if (!isNaN(Number(ruleValue)) && ruleValue.trim() !== '') {
              convertedValue = Number(ruleValue);
            } else if (ruleValue.toLowerCase() === 'true') {
              convertedValue = true;
            } else if (ruleValue.toLowerCase() === 'false') {
              convertedValue = false;
            }
          }

          const criterion: FrontmatterRuleCriterion = {
            field: ruleField,
            operator: ruleOperator,
            value: convertedValue,
          };

          const rule: FrontmatterRule = {
            name: ruleName,
            icon: ruleIcon,
            color: ruleColor || undefined,
            order: this.plugin.getSettings().frontmatterRules.length,
            enabled: true,
            for: ruleFor,
            criteria: [criterion],
          };

          this.plugin.getSettings().frontmatterRules = [
            ...this.plugin.getSettings().frontmatterRules,
            rule,
          ];
          await this.plugin.saveIconFolderData();

          try {
            if (!emoji.isEmoji(rule.icon)) {
              saveIconToIconPack(this.plugin, rule.icon);
            }
          } catch (e) {
            new Notice(`Error saving icon: ${e.message}`);
            return;
          }

          this.refreshDisplay();
          new Notice(`Frontmatter rule "${ruleName}" added successfully.`);
        });
      });
  }

  private displayExistingRules(): void {
    const rules = this.plugin.getSettings().frontmatterRules;
    if (rules.length === 0) {
      return;
    }

    const rulesContainer = this.containerEl.createDiv();
    rulesContainer.style.marginTop = '20px';

    const heading = rulesContainer.createEl('h4', { text: 'Existing Frontmatter Rules' });

    rules.forEach((rule, index) => {
      const ruleContainer = rulesContainer.createDiv();
      ruleContainer.style.marginBottom = '10px';
      ruleContainer.style.padding = '10px';
      ruleContainer.style.border = '1px solid var(--background-modifier-border)';
      ruleContainer.style.borderRadius = '5px';

      const criterion = rule.criteria[0]; // Simple UI only supports one criterion for now
      const description = `${rule.name}: ${criterion.field} ${criterion.operator} ${criterion.value || ''} → ${rule.icon}`;

      new Setting(ruleContainer)
        .setName(description)
        .setDesc(`Applies to: ${rule.for}`)
        .addToggle((toggle) => {
          toggle
            .setValue(rule.enabled !== false)
            .onChange(async (enabled) => {
              rule.enabled = enabled;
              await this.plugin.saveIconFolderData();
            });
        })
        .addButton((btn) => {
          btn.setButtonText('Delete');
          btn.setWarning();
          btn.onClick(async () => {
            this.plugin.getSettings().frontmatterRules.splice(index, 1);
            await this.plugin.saveIconFolderData();
            this.refreshDisplay();
            new Notice(`Rule "${rule.name}" deleted.`);
          });
        });
    });
  }
} 