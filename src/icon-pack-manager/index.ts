import config from '@app/config';
import { Notice } from 'obsidian';
import { LUCIDE_ICON_PACK_NAME, LucideIconPack } from './lucide';
import IconizePlugin from '@app/main';
import { FileManager } from './file-manager';
import { IconPack } from './icon-pack';
import { readZipFile } from '@app/zip-util';
import { logger } from '@app/lib/logger';
import JSZip from 'jszip';
import { generateIcon, getNormalizedName, nextIdentifier } from './util';

export interface Icon {
  name: string;
  prefix: string;
  displayName: string;
  iconPackName: string | null; // Can be `null` if the icon is an emoji.
  filename: string;
  svgContent: string;
  svgViewbox: string;
  svgElement: string;
}

export class IconPackManager {
  private path: string;
  private iconPacks: IconPack[];
  private lucideIconPack: LucideIconPack;
  private fileManager: FileManager;

  private preloadedIcons: Icon[];

  constructor(
    private plugin: IconizePlugin,
    path: string,
  ) {
    this.setPath(path);

    this.lucideIconPack = new LucideIconPack(plugin, this);
    this.fileManager = new FileManager(plugin);
    this.iconPacks = [];
    this.preloadedIcons = [];
  }

  public async init(): Promise<void> {
    const loadedIconPacks = await this.plugin.app.vault.adapter.list(this.path);
    for (let i = 0; i < loadedIconPacks.files.length; i++) {
      const fileName = loadedIconPacks.files[i];
      if (fileName.endsWith('.zip')) {
        const iconPackName = fileName.split('/').pop().split('.zip')[0];
        let iconPack = new IconPack(this.plugin, iconPackName, false);

        if (iconPackName === LUCIDE_ICON_PACK_NAME) {
          iconPack = this.lucideIconPack.init(iconPack);
        }

        this.iconPacks.push(iconPack);
        logger.info(`Initialized icon pack '${iconPackName}'`);
      }
    }

    if (this.plugin.doesUseNativeLucideIconPack()) {
      const iconPack = this.lucideIconPack.init();
      this.iconPacks.push(iconPack);
    }
  }

  public async loadAll(): Promise<void> {
    const loadedIconPacks = await this.plugin.app.vault.adapter.list(this.path);

    // Extract all zip files which will be downloaded icon packs.
    const zipFiles: Record<string, JSZip.JSZipObject[]> = {};
    for (let i = 0; i < loadedIconPacks.files.length; i++) {
      const fileName = loadedIconPacks.files[i];
      if (fileName.endsWith('.zip')) {
        const arrayBuffer =
          await this.plugin.app.vault.adapter.readBinary(fileName);
        const files = await readZipFile(arrayBuffer);
        const iconPackName = fileName.split('/').pop().split('.zip')[0];
        zipFiles[iconPackName] = files;
      }
    }

    // Check for custom-made icon packs.
    for (let i = 0; i < loadedIconPacks.folders.length; i++) {
      const folderName = loadedIconPacks.folders[i].split('/').pop();
      // Continue if the icon pack does have a zip file.
      if (zipFiles[folderName]) {
        continue;
      }

      const iconPack = new IconPack(this.plugin, folderName, true);

      const files = await this.fileManager.getFilesInDirectory(
        `${this.path}/${folderName}`,
      );
      const loadedIcons: Icon[] = [];
      // Convert files into loaded svgs.
      for (let j = 0; j < files.length; j++) {
        const iconNameRegex = files[j].match(
          new RegExp(this.path + '/' + folderName + '/(.*)'),
        );
        const iconName = getNormalizedName(iconNameRegex[1]);
        const iconContent = await this.plugin.app.vault.adapter.read(files[j]);
        const icon = generateIcon(iconPack, iconName, iconContent);
        if (icon) {
          loadedIcons.push(icon);
        }
      }

      if (!this.getIconPackByName(folderName)) {
        this.iconPacks.push(iconPack);
        logger.info(
          `Loaded icon pack '${folderName}' (amount of icons: ${loadedIcons.length})`,
        );
      }
    }

    // Extract all files from the zip files.
    for (const zipFile in zipFiles) {
      const files = zipFiles[zipFile];
      const existingIconPack = this.getIconPackByName(zipFile);
      const iconPack =
        existingIconPack ?? new IconPack(this.plugin, zipFile, false);
      const loadedIcons: Icon[] = await this.fileManager.getIconsFromZipFile(
        iconPack,
        files,
      );
      if (
        zipFile === LUCIDE_ICON_PACK_NAME &&
        !this.plugin.doesUseCustomLucideIconPack()
      ) {
        continue;
      }

      iconPack.setIcons(loadedIcons);
      if (!existingIconPack) {
        this.iconPacks.push(iconPack);
      }
      logger.info(
        `Loaded icon pack '${zipFile}' (amount of icons: ${loadedIcons.length})`,
      );
    }
  }

  public async createDefaultDirectory(): Promise<void> {
    await this.fileManager.createDirectory(this.path, '');
  }

  public addIconPack(iconPack: IconPack): void {
    this.iconPacks.push(iconPack);
  }

  public async extractIcon(icon: Icon, iconContent: string): Promise<void> {
    const doesIconPackDirExist = await this.plugin.app.vault.adapter.exists(
      `${this.path}/${icon.iconPackName}`,
    );
    if (!doesIconPackDirExist) {
      await this.plugin.app.vault.adapter.mkdir(
        `${this.path}/${icon.iconPackName}`,
      );
    }

    const doesIconFileExists = await this.plugin.app.vault.adapter.exists(
      `${this.path}/${icon.iconPackName}/${icon.name}.svg`,
    );
    if (!doesIconFileExists) {
      await this.fileManager.createFile(
        icon.iconPackName,
        this.path,
        `${icon.name}.svg`,
        iconContent,
      );
    }
  }

  public async loadUsedIcons(icons: string[]): Promise<void> {
    for (let i = 0; i < icons.length; i++) {
      const entry = icons[i];
      if (!entry) {
        continue;
      }

      await this.loadPreloadedIcon(entry);
    }
  }

  public async loadPreloadedIcon(iconName: string): Promise<void> {
    const nextLetter = nextIdentifier(iconName);
    const prefix = iconName.substring(0, nextLetter);
    const name = iconName.substring(nextLetter);

    const iconPack = this.getIconPackByPrefix(prefix);

    if (!iconPack) {
      // Ignore because background check automatically adds the icons and icon pack
      // directories.
      if (!this.plugin.getSettings().iconsBackgroundCheckEnabled) {
        new Notice(
          `Seems like you do not have an icon pack installed. (${iconName})`,
          5000,
        );
      }
      return;
    }

    if (
      iconPack.getName() === LUCIDE_ICON_PACK_NAME &&
      this.plugin.doesUseNativeLucideIconPack()
    ) {
      // Native lucide icons already exist for Obsidian.
      const lucideIcons = this.iconPacks.find(
        (iconPack) => iconPack.getName() === LUCIDE_ICON_PACK_NAME,
      );
      const icon = lucideIcons.getIcons().find((icon) => icon.name === name);
      if (!icon) {
        logger.warn(
          `Icon ${icon} does not exist in the native Lucide icon pack.`,
        );
        return;
      }

      this.preloadedIcons.push(icon);
      return;
    }

    const fullPath = this.path + '/' + iconPack.getName() + '/' + name + '.svg';
    if (!(await this.plugin.app.vault.adapter.exists(fullPath))) {
      logger.error(
        `Icon with name '${name}' was not found (full path: ${fullPath})`,
      );
      return;
    }

    const content = await this.plugin.app.vault.adapter.read(fullPath);
    const icon = generateIcon(iconPack, name, content);
    this.preloadedIcons.push(icon);
  }

  public async createCustomIconPackDirectory(dir: string): Promise<void> {
    await this.fileManager.createDirectory(this.path, dir);
    const iconPack = new IconPack(this.plugin, dir, true);
    this.iconPacks.push(iconPack);
  }

  public async registerIconPack(
    name: string,
    arrayBuffer: ArrayBuffer,
  ): Promise<void> {
    const files = await readZipFile(arrayBuffer);
    const iconPack = new IconPack(this.plugin, name, false);
    const loadedIcons: Icon[] = await this.fileManager.getIconsFromZipFile(
      iconPack,
      files,
    );
    iconPack.setIcons(loadedIcons);
    this.addIconPack(iconPack);
    logger.info(
      `Loaded icon pack ${name} (amount of icons: ${loadedIcons.length})`,
    );
  }

  public async moveIconPackDirectories(
    from: string,
    to: string,
  ): Promise<void> {
    // Tries to move all icon packs to the new folder.
    for (let i = 0; i < this.iconPacks.length; i++) {
      const iconPack = this.iconPacks[i];
      const iconPackName = iconPack.getName();
      if (
        await this.plugin.app.vault.adapter.exists(`${from}/${iconPackName}`)
      ) {
        // Tries to create a new directory in the new path.
        const doesDirExist = await this.fileManager.createDirectory(
          this.path,
          iconPackName,
        );
        if (doesDirExist) {
          new Notice(`Directory withName ${iconPackName} already exists.`);
          continue;
        }
      }

      new Notice(`Moving ${iconPackName}...`);

      // Move the zip file.
      if (
        await this.plugin.app.vault.adapter.exists(
          `${from}/${iconPackName}.zip`,
        )
      ) {
        await this.plugin.app.vault.adapter.copy(
          `${from}/${iconPackName}.zip`,
          `${to}/${iconPackName}.zip`,
        );
      }

      // Move all other files inside of the iconpack directory.
      const filesInDirectory = await this.fileManager.getFilesInDirectory(
        `${from}/${iconPackName}`,
      );

      for (const file of filesInDirectory) {
        const fileName = file.split('/').pop();
        await this.plugin.app.vault.adapter.copy(
          `${from}/${iconPackName}/${fileName}`,
          `${to}/${iconPackName}/${fileName}`,
        );
      }

      new Notice(`...moved ${iconPackName}`);
    }

    // Removes all the existing icon packs in the `from` directory.
    for (let i = 0; i < this.iconPacks.length; i++) {
      const iconPack = this.iconPacks[i];
      const iconPackName = iconPack.getName();
      if (
        await this.plugin.app.vault.adapter.exists(`${from}/${iconPackName}`)
      ) {
        await this.plugin.app.vault.adapter.rmdir(
          `${from}/${iconPackName}`,
          true,
        );
      }
    }

    // Remove root directory that contains all the icon packs.
    if (!to.startsWith(from)) {
      await this.plugin.app.vault.adapter.rmdir(`${from}`, true);
    }
  }

  public doesIconExists(iconName: string): boolean {
    return (
      this.allLoadedIconNames.find(
        (icon) =>
          icon.name === iconName || icon.prefix + icon.name === iconName,
      ) !== undefined
    );
  }

  public doesIconPackExist(iconPackName: string): Promise<boolean> {
    return this.plugin.app.vault.adapter.exists(`${this.path}/${iconPackName}`);
  }

  public get allLoadedIconNames(): Icon[] {
    return this.iconPacks.reduce((total: Icon[], iconPack) => {
      total.push(...iconPack.getIcons());
      return total;
    }, []);
  }

  public setPath(newPath: string): void {
    if (newPath === 'plugins/obsidian-icon-folder/icons') {
      newPath = '.obsidian/plugins/obsidian-icon-folder/icons';
      new Notice(
        `[${config.PLUGIN_NAME}] Due to a change in version v1.2.2, the icon pack folder changed. Please change it in the settings to not be directly in /plugins.`,
        8000,
      );
    }

    // Remove the beginning slash because paths which start with `/` are the same as without
    // a slash.
    if (newPath.startsWith('/')) {
      newPath = newPath.slice(1);
    }

    this.path = newPath;
  }

  public async removeIconPack(iconPack: IconPack): Promise<void> {
    const iconPackIndex = this.iconPacks.findIndex(
      (ip) => ip.getName() === iconPack.getName(),
    );
    if (iconPackIndex > -1) {
      this.iconPacks.splice(iconPackIndex);
    }
    await iconPack.delete();
  }

  public getLucideIconPack(): LucideIconPack {
    return this.lucideIconPack;
  }

  public getPath(): string {
    return this.path;
  }

  public getIconPackByName(name: string): IconPack | undefined {
    return this.iconPacks.find((iconPack) => iconPack.getName() === name);
  }

  public getIconPackByPrefix(prefix: string): IconPack | undefined {
    return this.iconPacks.find((iconPack) => iconPack.getPrefix() === prefix);
  }

  public getIconPacks(): IconPack[] {
    return this.iconPacks;
  }

  public getPreloadedIcons(): Icon[] {
    return this.preloadedIcons;
  }

  public getFileManager(): FileManager {
    return this.fileManager;
  }
}
