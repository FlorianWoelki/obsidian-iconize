import config from '@app/config';
import { logger } from '@app/lib/logger';
import IconizePlugin from '@app/main';
import { Notice } from 'obsidian';
import { generateIcon, getNormalizedName } from './util';
import JSZip from 'jszip';
import { getExtraPath } from '@app/icon-packs';
import { getFileFromJSZipFile } from '@app/zip-util';
import { IconPack } from './icon-pack';
import { Icon } from '.';

export class FileManager {
  constructor(private plugin: IconizePlugin) {}

  // TODO: Maybe remove `path` and combine with `dir` param.
  public async createFile(
    iconPackName: string,
    path: string,
    filename: string,
    content: string,
    absoluteFilename?: string,
  ): Promise<void> {
    const normalizedFilename = getNormalizedName(filename);
    const exists = await this.plugin.app.vault.adapter.exists(
      `${path}/${iconPackName}/${normalizedFilename}`,
    );
    if (exists) {
      const folderSplit = absoluteFilename.split('/');
      if (folderSplit.length >= 2) {
        const folderName = folderSplit[folderSplit.length - 2];
        const newFilename = folderName + normalizedFilename;
        await this.plugin.app.vault.adapter.write(
          `${path}/${iconPackName}/${newFilename}`,
          content,
        );
        logger.info(
          `Renamed old file ${normalizedFilename} to ${newFilename} due to duplication`,
        );
        new Notice(
          `[${config.PLUGIN_NAME}] Renamed ${normalizedFilename} to ${newFilename} to avoid duplication.`,
          8000,
        );
      } else {
        logger.warn(
          `Could not create icons with duplicated file names (file name: ${normalizedFilename})`,
        );
        new Notice(
          `[${config.PLUGIN_NAME}] Could not create duplicated icon name (${normalizedFilename})`,
          8000,
        );
      }
    } else {
      await this.plugin.app.vault.adapter.write(
        `${path}/${iconPackName}/${normalizedFilename}`,
        content,
      );
    }
  }

  // TODO: Maybe remove `path` and combine with `dir` param.
  public async createDirectory(path: string, dir: string): Promise<boolean> {
    const doesDirExist = await this.plugin.app.vault.adapter.exists(
      `${path}/${dir}`,
    );
    if (!doesDirExist) {
      await this.plugin.app.vault.adapter.mkdir(`${path}/${dir}`);
    }

    return doesDirExist;
  }

  public async deleteFile(filePath: string): Promise<void> {
    await this.plugin.app.vault.adapter.remove(filePath);
  }

  public async getFilesInDirectory(dir: string): Promise<string[]> {
    if (!(await this.plugin.app.vault.adapter.exists(dir))) {
      return [];
    }

    return (await this.plugin.app.vault.adapter.list(dir)).files;
  }

  // TODO: Maybe remove `path` and combine with `dir` param.
  public async createZipFile(
    path: string,
    filename: string,
    buffer: ArrayBuffer,
  ): Promise<void> {
    await this.plugin.app.vault.adapter.writeBinary(
      `${path}/${filename}`,
      buffer,
    );
  }

  public async getIconsFromZipFile(
    iconPack: IconPack,
    files: JSZip.JSZipObject[],
  ): Promise<Icon[]> {
    const loadedIcons: Icon[] = [];
    const extraPath = getExtraPath(iconPack.getName());

    for (let j = 0; j < files.length; j++) {
      // Checks if the icon pack has an extra path. Also ignores files which do not start
      // with the extra path.
      if (extraPath && !files[j].name.startsWith(extraPath)) {
        continue;
      }

      const file = await getFileFromJSZipFile(files[j]);
      const iconContent = await file.text();
      const iconName = getNormalizedName(file.name);
      const icon = generateIcon(iconPack, iconName, iconContent);
      if (icon) {
        loadedIcons.push(icon);
      }
    }
    return loadedIcons;
  }
}
