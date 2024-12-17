import { logger } from '@app/lib/logger';
import { generateIcon, getNormalizedName } from './util';
import IconizePlugin from '@app/main';
import { Icon } from '.';

export class IconPack {
  private icons: Icon[];
  private prefix: string;

  constructor(
    private plugin: IconizePlugin,
    private name: string,
    private isCustom: boolean,
  ) {
    this.icons = [];
    this.prefix = this.generatePrefix();
  }

  private generatePrefix(): string {
    if (this.name.includes('-')) {
      const splitted = this.name.split('-');
      let result = splitted[0].charAt(0).toUpperCase();
      for (let i = 1; i < splitted.length; i++) {
        result += splitted[i].charAt(0).toLowerCase();
      }

      return result;
    }

    return (
      this.name.charAt(0).toUpperCase() + this.name.charAt(1).toLowerCase()
    );
  }

  public async delete(): Promise<void> {
    const path = this.plugin.getIconPackManager().getPath();
    // Check for the icon pack directory and delete it.
    if (await this.plugin.app.vault.adapter.exists(`${path}/${this.name}`)) {
      await this.plugin.app.vault.adapter.rmdir(`${path}/${this.name}`, true);
    }
    // Check for the icon pack zip file and delete it.
    if (
      await this.plugin.app.vault.adapter.exists(`${path}/${this.name}.zip`)
    ) {
      await this.plugin.app.vault.adapter.remove(`${path}/${this.name}.zip`);
    }
  }

  public addIcon(iconName: string, iconContent: string): Icon | undefined {
    // Normalize the icon name to remove `-` or `_` in the name.
    iconName = getNormalizedName(iconName);
    const icon = generateIcon(this, iconName, iconContent);
    if (!icon) {
      logger.warn(
        `Icon could not be generated (icon: ${iconName}, content: ${iconContent})`,
      );
      return undefined;
    }

    this.icons.push(icon);

    return icon;
  }

  public removeIcon(path: string, iconName: string): Promise<void> {
    if (this.isCustom) {
      return;
    }

    return this.plugin.app.vault.adapter.rmdir(
      `${path}/${this.name}/${iconName}.svg`,
      true,
    );
  }

  public getIcon(iconName: string): Icon | undefined {
    return this.icons.find((icon) => getNormalizedName(icon.name) === iconName);
  }

  public setIcons(icons: Icon[]): void {
    this.icons = icons;
  }

  public getName(): string {
    return this.name;
  }

  public getPrefix(): string {
    return this.prefix;
  }

  public getIcons(): Icon[] {
    return this.icons;
  }
}
