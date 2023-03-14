import icon from './lib/icon';
import IconFolderPlugin from './main';

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
  const entries = icon.getAllWithPath(plugin);

  entries.forEach((entry) => {
    if (entry) {
      const { path, icon } = entry;

      const migration = migrationMap.find(
        (migration) => icon.substring(0, 2) === migration.oldIconPackPrefix && icon.includes(migration.identifier),
      );

      if (migration) {
        data[path] =
          migration.transformation +
          icon.substring(migration.oldIconPackPrefix.length, icon.indexOf(migration.identifier));
      }
    }
  });

  return data;
};
