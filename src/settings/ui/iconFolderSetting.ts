import IconFolderPlugin from '@app/main';

export default abstract class IconFolderSetting {
  protected plugin: IconFolderPlugin;
  protected containerEl: HTMLElement;

  constructor(plugin: IconFolderPlugin, containerEl: HTMLElement) {
    this.plugin = plugin;
    this.containerEl = containerEl;
  }

  public abstract display(): void;
}
