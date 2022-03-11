import {
  App,
  BaseComponent,
  DropdownComponent,
  Notice,
  PluginSettingTab,
  Setting,
  SliderComponent,
  TextComponent,
} from 'obsidian';
import { ColorPickerComponent } from './colorPickerComponent';
import { addIconToIconPack, createFile, createIconPackDirectory, getAllIconPacks } from './iconPackManager';
import IconFolderPlugin from './main';
import { DEFAULT_SETTINGS, ExtraPaddingSettings } from './settings';
import { refreshIconStyle } from './util';

export default class IconFolderSettingsTab extends PluginSettingTab {
  plugin: IconFolderPlugin;
  textComponent: TextComponent;

  constructor(app: App, plugin: IconFolderPlugin) {
    super(app, plugin);

    this.plugin = plugin;
  }

  private normalizeIconPackName(value: string): string {
    return value.toLowerCase().replace(/\s/g, '-');
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();
    containerEl.createEl('h2', { text: 'Icon Folder Settings' });

    new Setting(containerEl)
      .setName('Recently used Icons limit')
      .setDesc('Change the limit for the recently used icons displayed in the icon modal.')
      .addSlider((slider) => {
        slider
          .setLimits(1, 15, 1)
          .setDynamicTooltip()
          .setValue(this.plugin.getSettings().recentlyUsedIconsSize ?? DEFAULT_SETTINGS.recentlyUsedIconsSize)
          .onChange(async (val) => {
            this.plugin.getSettings().recentlyUsedIconsSize = val;
            await this.plugin.checkRecentlyUsedIcons();
            await this.plugin.saveIconFolderData();
          });
      });

    containerEl.createEl('h3', { text: 'Icon Packs' });

    new Setting(containerEl)
      .setName('Add custom icon pack')
      .setDesc('Add a custom icon pack')
      .addText((text) => {
        text.setPlaceholder('Your icon pack name');
        this.textComponent = text;
      })
      .addButton((btn) => {
        btn.setButtonText('Add icon pack');
        btn.buttonEl.style.marginLeft = '12px';
        btn.onClick(async () => {
          const name = this.textComponent.getValue();
          if (name.length === 0) {
            return;
          }

          await createIconPackDirectory(this.plugin, this.normalizeIconPackName(this.textComponent.getValue()));
          this.textComponent.setValue('');
          this.display();
          new Notice('Icon pack successfully created.');
        });
      });

    getAllIconPacks().forEach((iconPack) => {
      const iconPackSetting = new Setting(containerEl)
        .setName(iconPack.name)
        .setDesc(`Total icons: ${iconPack.icons.length}`);
      iconPackSetting.addButton((btn) => {
        btn.setButtonText('Add icon');
        btn.onClick(() => {
          const fileSelector = document.createElement('input');
          fileSelector.setAttribute('type', 'file');
          fileSelector.setAttribute('multiple', 'multiple');
          fileSelector.setAttribute('accept', '.svg');
          fileSelector.click();
          fileSelector.onchange = (e) => {
            const target = e.target as HTMLInputElement;
            for (let i = 0; i < target.files.length; i++) {
              const file = target.files[i] as File;
              const reader = new FileReader();
              reader.readAsText(file, 'UTF-8');
              reader.onload = async (readerEvent) => {
                const content = readerEvent.target.result as string;
                await createFile(this.plugin, iconPack.name, file.name, content);
                addIconToIconPack(iconPack.name, file.name, content);
                iconPackSetting.setDesc(`Total icons: ${iconPack.icons.length} (added: ${file.name})`);
                new Notice('Icons successfully added.');
              };
            }
          };
        });
      });
    });

    containerEl.createEl('h3', { text: 'Icon Folder Customization' });

    new Setting(containerEl)
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

            refreshIconStyle(this.plugin);
          });
      });

    const colorCustomization = new Setting(containerEl)
      .setName('Icon color')
      .setDesc('Change the color of the displayed icons.');
    const colorPicker = new ColorPickerComponent(colorCustomization.controlEl)
      .setValue(this.plugin.getSettings().iconColor ?? '#000000')
      .onChange(async (value) => {
        this.plugin.getSettings().iconColor = value;
        await this.plugin.saveIconFolderData();

        refreshIconStyle(this.plugin);
      });

    colorCustomization.addButton((button) => {
      button
        .setButtonText('Default')
        .setTooltip('Set color to the default one')
        .onClick(async () => {
          colorPicker.setValue('#000000');
          this.plugin.getSettings().iconColor = null;
          await this.plugin.saveIconFolderData();

          refreshIconStyle(this.plugin);
        });
    });

    colorCustomization.components.push(colorPicker.build());

    const extraPaddingSetting = new Setting(containerEl)
      .setName('Top Extrapadding (in pixels)')
      .setDesc('Change the top padding of the icons.')
      .setClass('obsidian-icon-folder-setting');
    const extraPaddingDropdown = new DropdownComponent(extraPaddingSetting.controlEl).addOptions({
      top: 'Top',
      right: 'Right',
      bottom: 'Bottom',
      left: 'Left',
    } as Record<keyof ExtraPaddingSettings, string>);
    const extraPaddingSlider = new SliderComponent(extraPaddingSetting.controlEl)
      .setLimits(0, 24, 1)
      .setDynamicTooltip()
      .setValue(this.plugin.getSettings().extraPadding?.top ?? 2)
      .onChange(async (val) => {
        const dropdownValue = extraPaddingDropdown.getValue() as keyof ExtraPaddingSettings;
        if (this.plugin.getSettings().extraPadding) {
          this.plugin.getSettings().extraPadding[dropdownValue] = val;
        } else {
          this.plugin.getSettings().extraPadding = {
            [dropdownValue]: val,
          };
        }
        await this.plugin.saveIconFolderData();

        refreshIconStyle(this.plugin);
      });
    extraPaddingDropdown.onChange((val: keyof ExtraPaddingSettings) => {
      if (this.plugin.getSettings().extraPadding) {
        extraPaddingSlider.setValue(this.plugin.getSettings().extraPadding[val] ?? 2);
      } else {
        extraPaddingSlider.setValue(2);
      }
    });
    extraPaddingSetting.components.push(extraPaddingDropdown, extraPaddingSlider);
  }
}
