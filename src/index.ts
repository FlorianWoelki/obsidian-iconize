import IconizeAPI from './lib/api';
import IconizePlugin from './main';

export function getApi(plugin: IconizePlugin): IconizeAPI | undefined {
  return plugin.app.plugins.plugins['obsidian-icon-folder']?.api;
}
