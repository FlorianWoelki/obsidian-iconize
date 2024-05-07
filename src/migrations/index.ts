import IconFolderPlugin from '@app/main';
import migrate0001 from './0001-change-migrated-true-to-1';
import migrate0002 from './0002-order-custom-rules';
import migrate0003 from './0003-inheritance-to-custom-rule';
import migrate0004 from './0004-remove-none-emoji-option';

export const migrate = async (plugin: IconFolderPlugin): Promise<void> => {
  // eslint-disable-next-line
  // @ts-ignore - Required because an older version of the plugin saved the `migrated`
  // property as a boolean instead of a number.
  if (plugin.getSettings().migrated === true) {
    plugin.getSettings().migrated = 1;
  }

  await migrate0001(plugin);
  await migrate0002(plugin);
  await migrate0003(plugin);
  await migrate0004(plugin);

  await plugin.saveIconFolderData();
};
