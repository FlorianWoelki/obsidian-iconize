import {
  deleteIconPack,
  NATIVE_LUCIDE_ICON_PACK_NAME,
} from '@app/icon-pack-manager';
import IconizePlugin from '@app/main';

export default async function migrate(plugin: IconizePlugin): Promise<void> {
  if (plugin.getSettings().migrated === 5) {
    await deleteIconPack(plugin, NATIVE_LUCIDE_ICON_PACK_NAME);
    plugin.getSettings().migrated++;
  }
}
