import { LUCIDE_ICON_PACK_NAME } from '@app/icon-pack-manager/lucide';
import IconizePlugin from '@app/main';

export default async function migrate(plugin: IconizePlugin): Promise<void> {
  if (plugin.getSettings().migrated === 5) {
    const iconPack = plugin
      .getIconPackManager()
      .getIconPackByName(LUCIDE_ICON_PACK_NAME);
    await plugin.getIconPackManager().removeIconPack(iconPack);
    plugin.getSettings().migrated++;
  }
}
