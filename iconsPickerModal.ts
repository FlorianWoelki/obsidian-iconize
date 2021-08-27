import * as remixicons from 'react-icons/ri/index';
import { App, FuzzySuggestModal } from "obsidian";
import IconFolderPlugin from "./main";
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
  }
}
