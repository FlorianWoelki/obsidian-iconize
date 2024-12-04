import {
  App,
  Notice,
  Setting,
  TextComponent,
  ColorComponent,
  ButtonComponent,
  Modal,
  ToggleComponent,
} from 'obsidian';
import IconFolderSetting from './iconFolderSetting';
import IconsPickerModal from '@app/ui/icons-picker-modal';
import IconizePlugin from '@app/main';
import {
  getAllOpenedFiles,
  getFileItemTitleEl,
  removeIconFromIconPack,
  saveIconToIconPack,
} from '@app/util';
import { CustomRule } from '../data';
import customRule from '@lib/custom-rule';
import iconTabs from '@lib/icon-tabs';
import dom from '@lib/util/dom';
import svg from '@lib/util/svg';
import { getNormalizedName } from '@app/icon-pack-manager';
import { TabHeaderLeaf } from '@app/@types/obsidian';
import emoji from '@app/emoji';

export default class CustomIconRuleSetting extends IconFolderSetting {
  private app: App;
  private textComponent: TextComponent;
  private chooseIconBtn: ButtonComponent;
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

  /**
   * Updates all the open files based on the custom rule that was specified.
   * @param rule Rule that will be used to update all the icons for all opened files.
   * @param remove Whether to remove the icons that are applicable to the rule or not.
   */
  private async updateIconTabs(
    rule: CustomRule,
    remove: boolean,
    cachedPaths: string[] = [],
  ): Promise<void> {
    if (this.plugin.getSettings().iconInTabsEnabled) {
      for (const openedFile of getAllOpenedFiles(this.plugin)) {
        if (cachedPaths.includes(openedFile.path)) {
          continue;
        }

        const applicable = await customRule.isApplicable(
          this.plugin,
          rule,
          openedFile.path,
        );
        if (!applicable) {
          continue;
        }

        const leaf = openedFile.leaf as TabHeaderLeaf;
        if (remove) {
          iconTabs.remove(leaf.tabHeaderInnerIconEl, {
            replaceWithDefaultIcon: true,
          });
        } else {
          iconTabs.add(
            this.plugin,
            openedFile.path,
            leaf.tabHeaderInnerIconEl,
            {
              iconName: rule.icon,
              iconColor: rule.color,
            },
          );
        }
      }
    }
  }

  private createDescriptionEl(container: HTMLElement, text: string): void {
    const description = container.createEl('p', {
      text,
      cls: 'setting-item-description',
    });
    description.style.marginBottom = 'var(--size-2-2)';
  }

  public display(): void {
    new Setting(this.containerEl)
      .setName('Add icon rule')
      .setDesc(
        'Will add the icon based on the defined rule (as a plain string or in regex format).',
      )
      .addText((text) => {
        text.onChange((value) => {
          this.chooseIconBtn.setDisabled(value.length === 0);
          this.chooseIconBtn.buttonEl.style.cursor =
            value.length === 0 ? 'not-allowed' : 'default';
          this.chooseIconBtn.buttonEl.style.opacity =
            value.length === 0 ? '50%' : '100%';
        });
        text.setPlaceholder('regex or simple string');
        this.textComponent = text;
      })
      .addButton((btn) => {
        btn.setDisabled(true);
        btn.setButtonText('Choose icon');
        btn.onClick(async () => {
          if (this.textComponent.getValue().length === 0) {
            return;
          }

          const modal = new IconsPickerModal(this.app, this.plugin, '');
          modal.onChooseItem = async (item) => {
            const icon = getNormalizedName(
              typeof item === 'object' ? item.displayName : item,
            );

            const rule: CustomRule = {
              rule: this.textComponent.getValue(),
              icon,
              for: 'everything',
              order: this.plugin.getSettings().rules.length,
            };
            this.plugin.getSettings().rules = [
              ...this.plugin.getSettings().rules,
              rule,
            ];
            await this.plugin.saveIconFolderData();

            this.refreshDisplay();
            new Notice('Icon rule added.');
            this.textComponent.setValue('');

            saveIconToIconPack(this.plugin, rule.icon);

            await customRule.addToAllFiles(this.plugin, rule);
            this.updateIconTabs(rule, false);
          };
          modal.open();
        });
        this.chooseIconBtn = btn;
      });

    this.plugin.getSettings().rules.forEach((rule) => {
      // Keeping track of the old rule so that we can get a reference to it for old values.
      const oldRule = { ...rule };
      const settingRuleEl = new Setting(this.containerEl)
        .setName(rule.rule)
        .setDesc(`Icon: ${rule.icon}`);
      const currentOrder = rule.order;

      /**
       * Re-orders the custom rule based on the value that is passed in.
       * @param valueForReorder Number that will be used to determine whether to swap the
       * custom rule with the next rule or the previous rule.
       */
      const orderCustomRules = async (
        valueForReorder: number,
      ): Promise<void> => {
        const otherRule =
          this.plugin.getSettings().rules[currentOrder + valueForReorder];
        // Swap the current rule with the next rule.
        otherRule.order = otherRule.order - valueForReorder;
        rule.order = currentOrder + valueForReorder;
        // Refreshes the DOM.
        await customRule.removeFromAllFiles(this.plugin, oldRule);
        await this.plugin.saveIconFolderData();

        const addedPaths: string[] = [];
        for (const fileExplorer of this.plugin.getRegisteredFileExplorers()) {
          const files = Object.values(fileExplorer.fileItems || {});
          for (const rule of customRule.getSortedRules(this.plugin)) {
            // Removes the icon tabs from all opened files.
            this.updateIconTabs(rule, true, addedPaths);
            // Adds the icon tabs to all opened files.
            this.updateIconTabs(rule, false, addedPaths);

            for (const fileItem of files) {
              if (addedPaths.includes(fileItem.file.path)) {
                continue;
              }

              const added = await customRule.add(
                this.plugin,
                rule,
                fileItem.file,
                getFileItemTitleEl(fileItem),
              );
              if (added) {
                addedPaths.push(fileItem.file.path);
              }
            }
          }
        }

        this.refreshDisplay();
      };

      // Add the move down custom rule button to re-order the custom rule.
      settingRuleEl.addExtraButton((btn) => {
        const isFirstOrder = currentOrder === 0;
        btn.setDisabled(isFirstOrder);
        btn.extraSettingsEl.style.cursor = isFirstOrder
          ? 'not-allowed'
          : 'default';
        btn.extraSettingsEl.style.opacity = isFirstOrder ? '50%' : '100%';
        btn.setIcon('arrow-up');
        btn.setTooltip('Prioritize the custom rule');
        btn.onClick(async () => {
          await orderCustomRules(-1);
        });
      });

      // Add the move up custom rule button to re-order the custom rule.
      settingRuleEl.addExtraButton((btn) => {
        const isLastOrder =
          currentOrder === this.plugin.getSettings().rules.length - 1;
        btn.setDisabled(isLastOrder);
        btn.extraSettingsEl.style.cursor = isLastOrder
          ? 'not-allowed'
          : 'default';
        btn.extraSettingsEl.style.opacity = isLastOrder ? '50%' : '100%';
        btn.setIcon('arrow-down');
        btn.setTooltip('Deprioritize the custom rule');
        btn.onClick(async () => {
          await orderCustomRules(1);
        });
      });

      // Add the edit custom rule button.
      settingRuleEl.addButton((btn) => {
        btn.setIcon('pencil');
        btn.setTooltip('Edit the custom rule');
        btn.onClick(() => {
          // Create modal and its children elements.
          const modal = new Modal(this.plugin.app);
          modal.contentEl.style.display = 'block';
          modal.modalEl.classList.add('iconize-custom-modal');
          modal.titleEl.setText('Edit custom rule');

          // Create the input for the rule.
          this.createDescriptionEl(modal.contentEl, 'Regex or simple string');
          const input = new TextComponent(modal.contentEl);
          input.setValue(rule.rule);
          input.onChange(async (value) => {
            rule.rule = value;
          });

          const useFilePathContainer = modal.contentEl.createDiv();
          useFilePathContainer.style.display = 'flex';
          useFilePathContainer.style.alignItems = 'center';
          useFilePathContainer.style.justifyContent = 'space-between';
          useFilePathContainer.style.marginTop = 'var(--size-4-5)';
          const useFilePathDescription = useFilePathContainer.createEl('p', {
            text: 'Include folders and files that are part of the path.',
            cls: 'setting-item-description',
          });
          useFilePathDescription.style.margin = '0';
          useFilePathDescription.style.marginBottom = 'var(--size-2-2)';
          new ToggleComponent(useFilePathContainer)
            .setValue(rule.useFilePath === true)
            .onChange((value) => {
              rule.useFilePath = value;
            });

          // Create the toggle for changing the rule type.
          const ruleTypeContainer = modal.contentEl.createDiv();
          ruleTypeContainer.style.display = 'flex';
          ruleTypeContainer.style.alignItems = 'center';
          ruleTypeContainer.style.justifyContent = 'space-between';
          ruleTypeContainer.style.marginTop = 'var(--size-4-5)';
          const ruleTypeDescription = ruleTypeContainer.createEl('p', {
            text: 'Where the custom rule gets applied to.',
            cls: 'setting-item-description',
          });
          ruleTypeDescription.style.margin = '0';
          ruleTypeDescription.style.marginBottom = 'var(--size-2-2)';
          const ruleTypeButton = new ButtonComponent(ruleTypeContainer);
          const setButtonContent = (isFor: typeof rule.for) => {
            if (isFor === 'folders') {
              ruleTypeButton.setIcon('folder');
            } else if (isFor === 'files') {
              ruleTypeButton.setIcon('document');
            } else {
              ruleTypeButton.setIcon('documents');
            }
            ruleTypeButton.setTooltip(`Icon applicable to: ${isFor}`);
          };
          setButtonContent(rule.for ?? 'everything');
          ruleTypeButton.onClick(async () => {
            const isFor: typeof rule.for = rule.for ?? 'everything';
            this.updateIconTabs(rule, true);
            await customRule.removeFromAllFiles(this.plugin, {
              ...rule,
              for: isFor,
            });

            if (isFor === 'folders') {
              rule.for = 'everything';
            } else if (isFor === 'files') {
              rule.for = 'folders';
            } else {
              rule.for = 'files';
            }

            setButtonContent(rule.for);
          });

          // Create the change icon button with icon preview.
          this.createDescriptionEl(modal.contentEl, 'Custom rule icon');
          const iconContainer = modal.contentEl.createDiv();
          iconContainer.style.display = 'flex';
          iconContainer.style.alignItems = 'center';
          iconContainer.style.justifyContent = 'space-between';
          const iconEl = iconContainer.createDiv();
          const iconPreviewEl = iconEl.createDiv();
          dom.setIconForNode(this.plugin, rule.icon, iconPreviewEl);
          iconEl.style.display = 'flex';
          iconEl.style.alignItems = 'center';
          iconEl.style.justifyContent = 'space-between';
          iconEl.style.margin = null;
          iconPreviewEl.innerHTML = svg.setFontSize(
            iconPreviewEl.innerHTML,
            20,
          );
          const iconNameEl = iconEl.createEl('div', {
            cls: 'setting-item-description',
          });
          iconNameEl.style.paddingTop = '0';
          iconNameEl.style.marginLeft = 'var(--size-2-2)';
          iconNameEl.innerText = rule.icon;

          const changeIconBtn = new ButtonComponent(iconContainer);
          changeIconBtn.setButtonText('Change icon');
          changeIconBtn.onClick(async () => {
            const modal = new IconsPickerModal(
              this.app,
              this.plugin,
              rule.icon,
            );
            modal.onChooseItem = async (item) => {
              const icon = typeof item === 'object' ? item.displayName : item;
              rule.icon = icon;
              dom.setIconForNode(this.plugin, rule.icon, iconPreviewEl);
              iconPreviewEl.innerHTML = svg.setFontSize(
                iconPreviewEl.innerHTML,
                20,
              );
              iconNameEl.innerText = getNormalizedName(rule.icon);
            };
            modal.open();
          });

          // Create the color picker for the rule.
          this.createDescriptionEl(modal.contentEl, 'Color of the icon');
          const colorContainer = modal.contentEl.createDiv();
          colorContainer.style.display = 'flex';
          colorContainer.style.alignItems = 'center';
          colorContainer.style.justifyContent = 'space-between';
          const colorPicker = new ColorComponent(colorContainer)
            .setValue(rule.color ?? '#000000')
            .onChange((value) => {
              rule.color = value;
            });
          const defaultColorButton = new ButtonComponent(colorContainer);
          defaultColorButton.setTooltip('Set color to the default one');
          defaultColorButton.setButtonText('Default');
          defaultColorButton.onClick(() => {
            colorPicker.setValue('#000000');
            rule.color = undefined;
          });

          // Create the save button.
          const button = new ButtonComponent(modal.contentEl);
          button.buttonEl.style.marginTop = 'var(--size-4-4)';
          button.buttonEl.style.float = 'right';
          button.setButtonText('Save Changes');
          button.onClick(async () => {
            if (!emoji.isEmoji(oldRule.icon)) {
              // Tries to remove the previously used icon from the icon pack.
              removeIconFromIconPack(this.plugin, oldRule.icon);
            }

            if (!emoji.isEmoji(rule.icon)) {
              // Tries to add the newly used icon to the icon pack.
              saveIconToIconPack(this.plugin, rule.icon);
              rule.icon = getNormalizedName(rule.icon);
            }

            this.refreshDisplay();
            new Notice('Custom rule updated.');

            // Refresh the DOM.
            await customRule.removeFromAllFiles(this.plugin, oldRule);
            this.updateIconTabs(rule, true);
            this.plugin.getSettings().rules.forEach(async (rule) => {
              await customRule.addToAllFiles(this.plugin, rule);
              this.updateIconTabs(rule, false);
            });

            await this.plugin.saveIconFolderData();
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
              (r) =>
                rule.rule !== r.rule ||
                rule.color !== r.color ||
                rule.icon !== r.icon ||
                rule.for !== r.for,
            );
          this.plugin.getSettings().rules = newRules;
          await this.plugin.saveIconFolderData();

          this.refreshDisplay();
          new Notice('Custom rule deleted.');

          await customRule.removeFromAllFiles(this.plugin, rule);

          removeIconFromIconPack(this.plugin, rule.icon);

          this.updateIconTabs(rule, true);
          const previousRules = this.plugin
            .getSettings()
            .rules.filter((r) => rule.for === r.for);
          previousRules.forEach(async (previousRule) => {
            await customRule.addToAllFiles(this.plugin, previousRule);
            this.updateIconTabs(previousRule, false);
          });
        });
      });
    });
  }
}
