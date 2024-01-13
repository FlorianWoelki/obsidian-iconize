import config from '@app/config';
import customRule from '@app/lib/custom-rule';
import IconFolderPlugin from '@app/main';
import { CustomRule } from '@app/settings/data';
import { Notice } from 'obsidian';

interface FolderIconObject {
  iconName: string | null;
  inheritanceIcon?: string;
  iconColor?: string;
}

export default async function migrate(plugin: IconFolderPlugin): Promise<void> {
  // Migration for inheritance to custom rule.
  if (plugin.getSettings().migrated === 3) {
    let hasRemovedInheritance = false;
    for (const [key, value] of Object.entries(plugin.getData())) {
      if (key === 'settings' || typeof value !== 'object') {
        continue;
      }

      const folderData = value as FolderIconObject;
      const inheritanceIcon = folderData.inheritanceIcon;
      if (!inheritanceIcon) {
        continue;
      }

      const folderIconName = folderData.iconName;

      // Clean up old data.
      if (folderData.iconColor && folderIconName) {
        delete folderData.inheritanceIcon;
      } else if (folderIconName) {
        delete plugin.getData()[key];
        plugin.getData()[key] = folderIconName;
      } else if (!folderIconName) {
        delete plugin.getData()[key];
      }

      const folderPath = key + '\\/[\\w\\d\\s]+';
      const newRule = {
        icon: inheritanceIcon,
        rule: `${folderPath}\\.(?:\\w+\\.)*\\w+`,
        for: 'files',
        order: 0,
        useFilePath: true,
      } as CustomRule;

      // Reorder existing custom rules so that the new inheritance custom rule
      // is at the top.
      plugin.getSettings().rules.map((rule) => {
        rule.order++;
      });
      plugin.getSettings().rules.unshift(newRule);

      // Apply the custom rule.
      await customRule.addToAllFiles(plugin, newRule);
      hasRemovedInheritance = true;
    }

    if (hasRemovedInheritance) {
      new Notice(
        `[${config.PLUGIN_NAME}] Inheritance has been removed and replaced with custom rules.`,
      );
    }

    plugin.getSettings().migrated++;
  }
}
