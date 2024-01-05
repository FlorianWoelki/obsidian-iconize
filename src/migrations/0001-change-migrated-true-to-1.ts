import { Notice } from 'obsidian';
import IconFolderPlugin from '../main';

export default function migrate(plugin: IconFolderPlugin): void {
  // Migration for new syncing mechanism.
  if (plugin.getSettings().migrated === 1) {
    new Notice(
      'Please delete your old icon packs and redownload your icon packs to use the new syncing mechanism.',
      20000,
    );
    plugin.getSettings().migrated++;
  }
}
