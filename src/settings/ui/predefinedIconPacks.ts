import { App, Setting } from 'obsidian';
import IconFolderSetting from './iconFolderSetting';
import IconPackBrowserModal from '@app/ui/icon-pack-browser-modal';
import IconizePlugin from '@app/main';

export default class PredefinedIconPacksSetting extends IconFolderSetting {
  private app: App;
  private refreshDisplay: () => void;

  constructor(
    plugin: IconizePlugin,
    containerEl: HTMLElement,
    app: App,
    refreshDisplay: () => void,
  ) {
    super(plugin, containerEl);
    this.app = app;
    this.refreshDisplay = refreshDisplay;
  }

  public display(): void {
    new Setting(this.containerEl)
      .setName('Add predefined icon pack')
      .setDesc('Add a predefined icon pack that is officially supported.')
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
