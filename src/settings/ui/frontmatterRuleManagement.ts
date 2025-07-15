import { App, Setting, ButtonComponent, TextComponent, DropdownComponent, ToggleComponent } from 'obsidian';
import IconizePlugin from '@app/main';
import IconFolderSetting from './iconFolderSetting';
import { FrontmatterRule, FrontmatterRuleCriterion, FrontmatterRuleOperator } from '@app/settings/data';

export default class FrontmatterRuleManagement extends IconFolderSetting {
  constructor(plugin: IconizePlugin, containerEl: HTMLElement, private app: App, private displayCallback: () => void) {
    super(plugin, containerEl);
  }

  public display(): void {
    this.containerEl.createEl('h2', { text: 'Frontmatter Rules' });

    new Setting(this.containerEl)
      .setName('Add New Rule')
      .setDesc('Add a new frontmatter rule.')
      .addButton((button: ButtonComponent) => {
        button.setButtonText('Add Rule').onClick(async () => {
          const newRule: FrontmatterRule = {
            name: 'New Rule',
            icon: '',
            order: this.plugin.getSettings().frontmatterRules.length + 1,
            enabled: true,
            for: 'files',
            criteria: [],
          };
          this.plugin.getSettings().frontmatterRules.push(newRule);
          await this.plugin.saveIconFolderData();
          this.displayCallback(); // Refresh the settings tab
        });
      });

    this.plugin.getSettings().frontmatterRules.forEach((rule, index) => {
      this.renderRule(rule, index);
    });
  }

  private renderRule(rule: FrontmatterRule, index: number): void {
    const ruleContainer = this.containerEl.createDiv('iconize-frontmatter-rule-container');
    ruleContainer.createEl('h3', { text: `Rule: ${rule.name || 'Unnamed Rule'}` });

    new Setting(ruleContainer)
      .setName('Rule Name')
      .addText((text: TextComponent) => {
        text.setValue(rule.name).onChange(async (value) => {
          rule.name = value;
          await this.plugin.saveIconFolderData();
        });
      });

    new Setting(ruleContainer)
      .setName('Icon')
      .addText((text: TextComponent) => {
        text.setValue(rule.icon).onChange(async (value) => {
          rule.icon = value;
          await this.plugin.saveIconFolderData();
        });
      });

    new Setting(ruleContainer)
      .setName('Icon Color')
      .addText((text: TextComponent) => {
        text.setValue(rule.color || '').onChange(async (value) => {
          rule.color = value;
          await this.plugin.saveIconFolderData();
        });
      });

    new Setting(ruleContainer)
      .setName('Order')
      .addText((text: TextComponent) => {
        text.setPlaceholder('e.g., 1').setValue(rule.order.toString()).onChange(async (value) => {
          const numValue = parseInt(value);
          if (!isNaN(numValue)) {
            rule.order = numValue;
            await this.plugin.saveIconFolderData();
            // Re-sort rules after order change
            this.plugin.getSettings().frontmatterRules.sort((a, b) => a.order - b.order);
            this.displayCallback(); // Re-render only if order changes, to reflect sorting
          }
        });
      });

    new Setting(ruleContainer)
      .setName('Enabled')
      .addToggle((toggle: ToggleComponent) => {
        toggle.setValue(rule.enabled).onChange(async (value) => {
          rule.enabled = value;
          await this.plugin.saveIconFolderData();
        });
      });

    new Setting(ruleContainer)
      .setName('Apply to')
      .addDropdown((dropdown: DropdownComponent) => {
        dropdown
          .addOption('everything', 'Everything')
          .addOption('files', 'Files')
          .addOption('folders', 'Folders')
          .setValue(rule.for || 'files')
          .onChange(async (value: 'everything' | 'files' | 'folders') => {
            rule.for = value;
            await this.plugin.saveIconFolderData();
          });
      });

    ruleContainer.createEl('h4', { text: 'Criteria' });
    rule.criteria.forEach((criterion, critIndex) => {
      this.renderCriterion(rule, criterion, critIndex, ruleContainer);
    });

    new Setting(ruleContainer)
      .setName('Add Criterion')
      .addButton((button: ButtonComponent) => {
        button.setButtonText('Add').onClick(async () => {
          rule.criteria.push({ field: '', operator: 'equals', value: '' });
          await this.plugin.saveIconFolderData();
          this.displayCallback(); // Re-render to show new criterion
        });
      });

    new Setting(ruleContainer)
      .addButton((button: ButtonComponent) => {
        button.setButtonText('Delete Rule').setWarning().onClick(async () => {
          this.plugin.getSettings().frontmatterRules.splice(index, 1);
          await this.plugin.saveIconFolderData();
          this.displayCallback(); // Re-render to remove rule
        });
      });

    ruleContainer.createEl('hr'); // Separator for rules
  }

  private renderCriterion(rule: FrontmatterRule, criterion: FrontmatterRuleCriterion, critIndex: number, parentEl: HTMLElement): void {
    const criterionContainer = parentEl.createDiv('iconize-frontmatter-criterion-container');

    new Setting(criterionContainer)
      .setName(`Criterion ${critIndex + 1}`)
      .addText((text: TextComponent) => {
        text.setPlaceholder('Field Name').setValue(criterion.field).onChange(async (value) => {
          criterion.field = value;
          await this.plugin.saveIconFolderData();
        });
      })
      .addDropdown((dropdown: DropdownComponent) => {
        const operators: FrontmatterRuleOperator[] = [
          'equals', 'not-equals', 'greater-than', 'less-than', 'greater-equal',
          'less-equal', 'contains', 'not-contains', 'exists', 'not-exists'
        ];
        operators.forEach(op => dropdown.addOption(op, op));
        dropdown.setValue(criterion.operator).onChange(async (value: FrontmatterRuleOperator) => {
          criterion.operator = value;
          await this.plugin.saveIconFolderData();
          this.displayCallback(); // Re-render to hide/show value field based on operator
        });
      })
      .addText((text: TextComponent) => {
        text.setPlaceholder('Value').setValue(criterion.value?.toString() || '');
        if (criterion.operator === 'exists' || criterion.operator === 'not-exists') {
          text.inputEl.style.display = 'none'; // Hide value field for exists/not-exists
        }
        text.onChange(async (value) => {
          // Attempt to parse value as number or boolean if applicable, otherwise keep as string
          let parsedValue: string | number | boolean = value;
          if (!isNaN(parseFloat(value)) && isFinite(parseFloat(value))) {
            parsedValue = parseFloat(value);
          } else if (value.toLowerCase() === 'true') {
            parsedValue = true;
          } else if (value.toLowerCase() === 'false') {
            parsedValue = false;
          }
          criterion.value = parsedValue;
          await this.plugin.saveIconFolderData();
        });
      })
      .addButton((button: ButtonComponent) => {
        button.setButtonText('Remove').setWarning().onClick(async () => {
          rule.criteria.splice(critIndex, 1);
          await this.plugin.saveIconFolderData();
          this.displayCallback(); // Re-render to remove criterion
        });
      });
  }
}
