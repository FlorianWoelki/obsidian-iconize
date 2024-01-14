import { Notice } from 'obsidian';
import IconFolderPlugin from '@app/main';

export default async function migrate(plugin: IconFolderPlugin): Promise<void> {
  // Migration for new syncing mechanism.
  if (plugin.getSettings().migrated === 1) {
    new Notice(
      'Please delete your old icon packs and redownload your icon packs to use the new syncing mechanism.',
      20000,
    );
    plugin.getSettings().migrated++;
  }
}
