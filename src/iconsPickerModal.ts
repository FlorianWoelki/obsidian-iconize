import * as remixicons from 'react-icons/ri/index';
import { App, FuzzyMatch, FuzzySuggestModal } from 'obsidian';
import { renderToString } from 'react-dom/server';
import IconFolderPlugin from './main';
import { addToDOM } from './util';

export interface Icon {
  id: string;
  name: string;
}

export default class IconsPickerModal extends FuzzySuggestModal<any> {
  private plugin: IconFolderPlugin;
  private path: string;

  constructor(app: App, plugin: IconFolderPlugin, path: string) {
    super(app);
    this.plugin = plugin;
    this.path = path;
  }

  onOpen() {
    super.onOpen();
  }

  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }

  getItemText(item: Icon): string {
    return item.name;
  }

  getItems(): Icon[] {
    const iconKeys: Icon[] = [];
    for (let icon in remixicons) {
      iconKeys.push({
        id: icon,
        name: icon.substring(2),
      });
    }

    return iconKeys;
  }

  onChooseItem(item: Icon): void {
    addToDOM(this.plugin, this.path, item.id);
    this.plugin.addFolderIcon(this.path, item.id);
  }

  renderSuggestion(item: FuzzyMatch<Icon>, el: HTMLElement): void {
    super.renderSuggestion(item, el);

    if (item.item.id !== 'default') {
      const iconPreviewNode = el.createDiv('div');
      iconPreviewNode.innerHTML = renderToString(
        // @ts-ignore
        remixicons[item.item.id]({
          size: '16px',
        }),
      );
      iconPreviewNode.style.position = 'absolute';
      iconPreviewNode.style.top = '0';
      iconPreviewNode.style.left = '0';
      iconPreviewNode.style.marginTop = '7px';
    }
  }
}
