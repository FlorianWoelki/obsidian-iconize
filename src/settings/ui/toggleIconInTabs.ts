import { Setting } from 'obsidian';
import iconTabs from '@lib/iconTabs';
import IconFolderSetting from './iconFolderSetting';
import { TabHeaderLeaf } from '../../@types/obsidian';

export default class ToggleIconInTabs extends IconFolderSetting {
  public display(): void {
    new Setting(this.containerEl)
      .setName('Toggle Icon in Tabs')
      .setDesc('Toggles the visibility of an icon for a file in the tab bar.')
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.getSettings().iconInTabsEnabled)
          .onChange(async (enabled) => {
            this.plugin.getSettings().iconInTabsEnabled = enabled;
            await this.plugin.saveIconFolderData();

            // Updates the already opened files.
            this.plugin.app.workspace
              .getLeavesOfType('markdown')
              .forEach((leaf) => {
                const file = leaf.view.file;
                if (file) {
                  const tabHeaderLeaf = leaf as TabHeaderLeaf;
                  if (enabled) {
                    // Adds the icons to already opened files.
                    iconTabs.add(this.plugin, file, {
                      container: tabHeaderLeaf.tabHeaderInnerIconEl,
                    });
                  } else {
                    // Removes the icons from already opened files.
                    iconTabs.remove(file);
                  }
                }
              });
          });
      });
  }
}
