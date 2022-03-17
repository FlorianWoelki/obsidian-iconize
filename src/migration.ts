import IconFolderPlugin, { FolderIconObject } from './main';
import { isEmoji } from './util';

const migrationMap = [
  {
    oldIconPackPrefix: 'Fa',
    identifier: 'Brands',
    transformation: 'Fab',
  },
  {
    oldIconPackPrefix: 'Fa',
    identifier: 'Line',
    transformation: 'Far',
  },
  {
    oldIconPackPrefix: 'Fa',
    identifier: 'Fill',
    transformation: 'Fas',
  },
];

export const migrateIcons = (plugin: IconFolderPlugin) => {
  const data = { ...plugin.getData() };
  const entries = Object.entries(data).map(([key, value]: [string, string | FolderIconObject]) => {
    if (key !== 'settings' && key !== 'migrated' && key !== 'iconPacksPath') {
      if (typeof value === 'string') {
        if (!isEmoji(value)) {
          return [key, value];
        }
      }

      if (typeof value === 'object') {
        if (value.iconName !== null && !isEmoji(value.iconName)) {
          return [key, value.iconName];
        }
        if (value.inheritanceIcon !== null && !isEmoji(value.inheritanceIcon)) {
          return [key, value.inheritanceIcon];
        }
      }
    }
  });

  entries.forEach((entry) => {
    if (entry) {
      const [key, value] = entry;

      const migration = migrationMap.find(
        (migration) => value.substring(0, 2) === migration.oldIconPackPrefix && value.includes(migration.identifier),
      );

      if (migration) {
        data[key] =
          migration.transformation +
          value.substring(migration.oldIconPackPrefix.length, value.indexOf(migration.identifier));
      }
    }
  });

  return data;
};
