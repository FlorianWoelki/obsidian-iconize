import { Notice, Setting, TextComponent } from 'obsidian';
import IconFolderSetting from './iconFolderSetting';
import {
  addIconToIconPack,
  createFile,
  createIconPackDirectory,
  deleteIconPack,
  doesIconPackExist,
  getAllIconPacks,
  getFilesInDirectory,
  getIconPack,
  getPath,
  normalizeFileName,
} from '../iconPackManager';
import IconFolderPlugin from '../main';
import { addToDOM, removeFromDOM } from '../util';

export default class CustomIconPackSetting extends IconFolderSetting {
  private textComponent: TextComponent;
  private dragOverElement: HTMLElement;
  private closeTimer: any;
  private dragTargetElement: HTMLElement;

  constructor(plugin: IconFolderPlugin, containerEl: HTMLElement) {
    super(plugin, containerEl);
    this.dragOverElement = document.createElement('div');
    this.dragOverElement.addClass('obsidian-icon-folder-dragover-el');
    this.dragOverElement.style.display = 'hidden';
    this.dragOverElement.innerHTML = '<p>Drop to add icon.</p>';
  }

  private normalizeIconPackName(value: string): string {
    return value.toLowerCase().replace(/\s/g, '-');
  }

  private readFile(file: File, callback: (content: string) => void): void {
    const reader = new FileReader();
    reader.readAsText(file, 'UTF-8');
    reader.onload = async (readerEvent) => {
      const content = readerEvent.target.result as string;
      callback(content);
    };
  }

  private preventDefaults(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
  }

  private highlight(el: HTMLElement): void {
    clearTimeout(this.closeTimer);

    if (!this.dragTargetElement) {
      el.appendChild(this.dragOverElement);
      el.classList.add('obsidian-icon-folder-dragover');
      this.dragTargetElement = el;
    }
  }

  private unhighlight(target: HTMLElement, el: HTMLElement): void {
    if (this.dragTargetElement && this.dragTargetElement !== target) {
      this.dragTargetElement.removeChild(this.dragOverElement);
      this.dragTargetElement.classList.remove('obsidian-icon-folder-dragover');
      this.dragTargetElement = undefined;
    }

    clearTimeout(this.closeTimer);
    this.closeTimer = setTimeout(() => {
      if (this.dragTargetElement) {
        el.removeChild(this.dragOverElement);
        el.classList.remove('obsidian-icon-folder-dragover');
        this.dragTargetElement = undefined;
      }
    }, 100);
  }

  public display(): void {
    new Setting(this.containerEl)
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

          const normalizedName = this.normalizeIconPackName(this.textComponent.getValue());

          if (await doesIconPackExist(this.plugin, normalizedName)) {
            new Notice('Icon pack already exists.');
            return;
          }

          await createIconPackDirectory(this.plugin, normalizedName);
          this.textComponent.setValue('');
          this.display();
          new Notice('Icon pack successfully created.');
        });
      });

    getAllIconPacks().forEach((iconPack) => {
      const iconPackSetting = new Setting(this.containerEl)
        .setName(iconPack.name)
        .setDesc(`Total icons: ${iconPack.icons.length}`);
      iconPackSetting.addButton((btn) => {
        btn.setIcon('broken-link');
        btn.setTooltip('Try to fix icon pack');
        btn.onClick(async () => {
          new Notice('Try to fix icon pack...');
          getIconPack(iconPack.name).icons = [];
          const icons = await getFilesInDirectory(this.plugin, `${getPath()}/${iconPack.name}`);
          for (let i = 0; i < icons.length; i++) {
            const filePath = icons[i];
            const fileName = filePath.split('/').pop();
            const iconContent = await this.plugin.app.vault.adapter.read(filePath);

            await normalizeFileName(this.plugin, filePath);

            addIconToIconPack(iconPack.name, fileName, iconContent);
          }
          new Notice('...tried to fix icon pack');

          // Refreshes the DOM.
          Object.entries(this.plugin.getData()).forEach(async ([k, v]) => {
            const doesPathExist = await this.plugin.app.vault.adapter.exists(k, true);
            if (doesPathExist) {
              removeFromDOM(k);
              addToDOM(this.plugin, k, v);
            }
          });
        });
      });
      iconPackSetting.addButton((btn) => {
        btn.setIcon('create-new');
        btn.setTooltip('Add an icon');
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
              this.readFile(file, async (content) => {
                await createFile(this.plugin, iconPack.name, file.name, content);
                addIconToIconPack(iconPack.name, file.name, content);
                iconPackSetting.setDesc(`Total icons: ${iconPack.icons.length} (added: ${file.name})`);
              });
            }
            new Notice('Icons successfully added.');
          };
        });
      });
      iconPackSetting.addButton((btn) => {
        btn.setIcon('trash');
        btn.setTooltip('Remove the icon pack');
        btn.onClick(async () => {
          await deleteIconPack(this.plugin, iconPack.name);
          this.display();
          new Notice('Icon pack successfully deleted.');
        });
      });

      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((event) => {
        iconPackSetting.settingEl.addEventListener(event, this.preventDefaults, false);
      });
      ['dragenter', 'dragover'].forEach((event) => {
        iconPackSetting.settingEl.addEventListener(event, () => this.highlight(iconPackSetting.settingEl), false);
      });
      ['dragleave', 'drop'].forEach((event) => {
        iconPackSetting.settingEl.addEventListener(
          event,
          (event) => this.unhighlight(event.currentTarget as HTMLElement, iconPackSetting.settingEl),
          false,
        );
      });
      iconPackSetting.settingEl.addEventListener(
        'drop',
        (event) => {
          const files = event.dataTransfer.files;
          let successful = false;
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.type !== 'image/svg+xml') {
              new Notice(`File ${file.name} is not a XML file.`);
              continue;
            }

            successful = true;
            this.readFile(file, async (content) => {
              await createFile(this.plugin, iconPack.name, file.name, content);
              addIconToIconPack(iconPack.name, file.name, content);
              iconPackSetting.setDesc(`Total icons: ${iconPack.icons.length} (added: ${file.name})`);
            });
          }

          if (successful) {
            new Notice('Icons successfully added.');
          }
        },
        false,
      );
    });
  }
}
