import IconFolderPlugin from '../main';

export default function migrate(plugin: IconFolderPlugin): void {
  // Migration for new order functionality of custom rules.
  if (plugin.getSettings().migrated === 2) {
    // Sorting alphabetically was the default behavior before.
    plugin
      .getSettings()
      .rules.sort((a, b) => a.rule.localeCompare(b.rule))
      .forEach((rule, i) => {
        rule.order = i;
      });
    plugin.getSettings().migrated++;
  }
}
