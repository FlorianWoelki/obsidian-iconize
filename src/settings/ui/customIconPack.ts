import { Notice, Setting, TextComponent } from 'obsidian';
import { T } from '../../locales/translations';
import IconFolderSetting from './iconFolderSetting';
import IconizePlugin from '@app/main';
import { readFileSync } from '@app/util';
import icon from '@app/lib/icon';
import { LucideIconPackType } from '../data';
import { LUCIDE_ICON_PACK_NAME } from '@app/icon-pack-manager/lucide';

export default class CustomIconPackSetting extends IconFolderSetting {
  private textComponent: TextComponent;
  private dragOverElement: HTMLElement;
  private closeTimer: NodeJS.Timeout;
  private dragTargetElement: HTMLElement;
  private refreshDisplay: () => void;

  constructor(
    plugin: IconizePlugin,
    containerEl: HTMLElement,
    refreshDisplay: () => void,
  ) {
    super(plugin, containerEl);
    this.refreshDisplay = refreshDisplay;
    this.dragOverElement = document.createElement('div');
    this.dragOverElement.addClass('iconize-dragover-el');
    this.dragOverElement.style.display = 'hidden';
    this.dragOverElement.innerHTML = '<p>Drop to add icon.</p>';
  }

  private normalizeIconPackName(value: string): string {
    return value.toLowerCase().replace(/\s/g, '-');
  }

  private preventDefaults(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
  }

  private highlight(el: HTMLElement): void {
    clearTimeout(this.closeTimer);

    if (!this.dragTargetElement) {
      el.appendChild(this.dragOverElement);
      el.classList.add('iconize-dragover');
      this.dragTargetElement = el;
    }
  }

  private unhighlight(target: HTMLElement, el: HTMLElement): void {
    if (this.dragTargetElement && this.dragTargetElement !== target) {
      this.dragTargetElement.removeChild(this.dragOverElement);
      this.dragTargetElement.classList.remove('iconize-dragover');
      this.dragTargetElement = undefined;
    }

    clearTimeout(this.closeTimer);
    this.closeTimer = setTimeout(() => {
      if (this.dragTargetElement) {
        el.removeChild(this.dragOverElement);
        el.classList.remove('iconize-dragover');
        this.dragTargetElement = undefined;
      }
    }, 100);
  }

  public display(): void {
    new Setting(this.containerEl)
      .setName(T('Add custom icon pack'))
      .setDesc(T('Add a custom icon pack.'))
      .addText((text) => {
        text.setPlaceholder(T('Your icon pack name'));
        this.textComponent = text;
      })
      .addButton((btn) => {
        btn.setButtonText(T('Add icon pack'));
        btn.onClick(async () => {
          const name = this.textComponent.getValue();
          if (name.length === 0) {
            return;
          }

          const normalizedName = this.normalizeIconPackName(
            this.textComponent.getValue(),
          );

          if (
            await this.plugin
              .getIconPackManager()
              .doesIconPackExist(normalizedName)
          ) {
            new Notice(T('Icon pack already exists.'));
            return;
          }

          await this.plugin
            .getIconPackManager()
            .createCustomIconPackDirectory(normalizedName);
          this.textComponent.setValue('');
          this.refreshDisplay();
          new Notice(T('Icon pack successfully created.'));
        });
      });

    // Sorts lucide icon pack always to the top.
    const iconPacks = [...this.plugin.getIconPackManager().getIconPacks()].sort(
      (a, b) => {
        if (a.getName() === LUCIDE_ICON_PACK_NAME) return -1;
        if (b.getName() === LUCIDE_ICON_PACK_NAME) return 1;
        return a.getName().localeCompare(b.getName());
      },
    );

    iconPacks.forEach((iconPack) => {
      const isLucideIconPack = iconPack.getName() === LUCIDE_ICON_PACK_NAME;
      const additionalLucideDescription =
        '(Native Pack has fewer icons but 100% Obsidian Sync support)';
      const iconPackSetting = new Setting(this.containerEl)
        .setName(`${iconPack.getName()} (${iconPack.getPrefix()})`)
        .setDesc(
          `Total icons: ${iconPack.getIcons().length}${isLucideIconPack ? ` ${additionalLucideDescription}` : ''}`,
        );
      // iconPackSetting.addButton((btn) => {
      //   btn.setIcon('broken-link');
      //   btn.setTooltip('Try to fix icon pack');
      //   btn.onClick(async () => {
      //     new Notice('Try to fix icon pack...');
      //     getIconPack(iconPack.name).icons = [];
      //     const icons = await getFilesInDirectory(this.plugin, `${getPath()}/${iconPack.name}`);
      //     for (let i = 0; i < icons.length; i++) {
      //       const filePath = icons[i];
      //       const fileName = filePath.split('/').pop();
      //       const file = await this.plugin.app.vault.adapter.read(filePath);
      //       const iconContent = file
      //         .replace(/stroke="#fff"/g, 'stroke="currentColor"')
      //         .replace(/fill="#fff"/g, 'fill="currentColor"');

      //       await this.plugin.app.vault.adapter.write(filePath, iconContent);
      //       await normalizeFileName(this.plugin, filePath);

      //       addIconToIconPack(iconPack.name, fileName, iconContent);
      //     }
      //     new Notice('...tried to fix icon pack');

      //     // Refreshes the DOM.
      //     Object.entries(this.plugin.getData()).forEach(async ([k, v]) => {
      //       const doesPathExist = await this.plugin.app.vault.adapter.exists(k, true);
      //       if (doesPathExist && typeof v === 'string') {
      //         // dom.removeIconInPath(k);
      //         dom.createIconNode(this.plugin, k, v);
      //       }
      //     });
      //   });
      // });

      if (isLucideIconPack) {
        iconPackSetting.addDropdown((dropdown) => {
          dropdown.addOptions({
            native: T('Native'),
            custom: T('Custom'),
            none: T('None'),
          } satisfies Record<LucideIconPackType, string>);
          dropdown.setValue(this.plugin.getSettings().lucideIconPackType);
          dropdown.onChange(async (value: LucideIconPackType) => {
            dropdown.setDisabled(true);
            new Notice(T('Changing icon packs...'));
            this.plugin.getSettings().lucideIconPackType = value;
            await this.plugin.saveIconFolderData();
            if (value === 'native' || value === 'none') {
              await this.plugin
                .getIconPackManager()
                .getLucideIconPack()
                .removeCustom();
              this.plugin.getIconPackManager().getLucideIconPack().init();
            } else {
              await this.plugin
                .getIconPackManager()
                .getLucideIconPack()
                .addCustom();
              await icon.checkMissingIcons(
                this.plugin,
                Object.entries(this.plugin.getData()) as any,
              );
            }

            dropdown.setDisabled(false);
            new Notice(T('Done. This change requires a restart of Obsidian'));
          });
        });
        return;
      }

      iconPackSetting.addButton((btn) => {
        btn.setIcon('plus');
        btn.setTooltip(T('Add an icon'));
        btn.onClick(async () => {
          const fileSelector = document.createElement('input');
          fileSelector.setAttribute('type', 'file');
          fileSelector.setAttribute('multiple', 'multiple');
          fileSelector.setAttribute('accept', '.svg');
          fileSelector.click();
          fileSelector.onchange = async (e) => {
            const target = e.target as HTMLInputElement;
            for (let i = 0; i < target.files.length; i++) {
              const file = target.files[i] as File;
              const content = await readFileSync(file);
              await this.plugin
                .getIconPackManager()
                .getFileManager()
                .createFile(
                  iconPack.getName(),
                  this.plugin.getIconPackManager().getPath(),
                  file.name,
                  content,
                );
              iconPack.addIcon(file.name, content);
              iconPackSetting.setDesc(
                `Total icons: ${iconPack.getIcons().length} (added: ${file.name})`,
              );
            }
            new Notice(T('Icons successfully added.'));
          };
        });
      });
      iconPackSetting.addButton((btn) => {
        btn.setIcon('trash');
        btn.setTooltip(T('Remove the icon pack'));
        btn.onClick(async () => {
          await this.plugin.getIconPackManager().removeIconPack(iconPack);
          this.refreshDisplay();
          new Notice(T('Icon pack successfully deleted.'));
        });
      });

      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((event) => {
        iconPackSetting.settingEl.addEventListener(
          event,
          this.preventDefaults,
          false,
        );
      });
      ['dragenter', 'dragover'].forEach((event) => {
        iconPackSetting.settingEl.addEventListener(
          event,
          () => this.highlight(iconPackSetting.settingEl),
          false,
        );
      });
      ['dragleave', 'drop'].forEach((event) => {
        iconPackSetting.settingEl.addEventListener(
          event,
          (event) =>
            this.unhighlight(
              event.currentTarget as HTMLElement,
              iconPackSetting.settingEl,
            ),
          false,
        );
      });
      iconPackSetting.settingEl.addEventListener(
        'drop',
        async (event) => {
          const files = event.dataTransfer.files;
          let successful = false;
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.type !== 'image/svg+xml') {
              new Notice(`File ${file.name} is not a SVG file.`);
              continue;
            }

            successful = true;
            const content = await readFileSync(file);
            await this.plugin
              .getIconPackManager()
              .getFileManager()
              .createFile(
                iconPack.getName(),
                this.plugin.getIconPackManager().getPath(),
                file.name,
                content,
              );
            iconPack.addIcon(file.name, content);
            iconPackSetting.setDesc(
              `Total icons: ${iconPack.getIcons().length} (added: ${file.name})`,
            );
          }

          if (successful) {
            new Notice(T('Icons successfully added.'));
          }
        },
        false,
      );
    });
  }
}
