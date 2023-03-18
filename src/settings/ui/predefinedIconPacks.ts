import { App, Setting } from 'obsidian';
import IconFolderSetting from './iconFolderSetting';
import IconPackBrowserModal from '../../iconPackBrowserModal';
import IconFolderPlugin from '../../main';

export default class PredefinedIconPacksSetting extends IconFolderSetting {
  private app: App;
  private refreshDisplay: () => void;

  constructor(plugin: IconFolderPlugin, containerEl: HTMLElement, app: App, refreshDisplay: () => void) {
    super(plugin, containerEl);
    this.app = app;
    this.refreshDisplay = refreshDisplay;
  }

  public display(): void {
    new Setting(this.containerEl)
      .setName('Add predefined icon pack')
      .setDesc('Add an icon pack like FontAwesome or Remixicons')
      .addButton((btn) => {
        btn.setButtonText('Browse icon packs');
        btn.onClick(() => {
          const modal = new IconPackBrowserModal(this.app, this.plugin);
          modal.onAddedIconPack = () => {
            this.refreshDisplay();
          };
          modal.open();
        });
      });
  }
}
