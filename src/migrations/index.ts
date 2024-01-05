import IconFolderPlugin from '../main';
import migrate0001 from './0001-change-migrated-true-to-1';
import migrate0002 from './0002-order-custom-rules';

export const migrate = async (plugin: IconFolderPlugin): Promise<void> => {
  // eslint-disable-next-line
  // @ts-ignore - Required because an older version of the plugin saved the `migrated`
  // property as a boolean instead of a number.
  if (plugin.getSettings().migrated === true) {
    plugin.getSettings().migrated = 1;
  }

  migrate0001(plugin);
  migrate0002(plugin);

  await plugin.saveIconFolderData();
};
