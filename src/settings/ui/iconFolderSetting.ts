import IconizePlugin from '@app/main';

export default abstract class IconFolderSetting {
  protected plugin: IconizePlugin;
  protected containerEl: HTMLElement;

  constructor(plugin: IconizePlugin, containerEl: HTMLElement) {
    this.plugin = plugin;
    this.containerEl = containerEl;
  }

  public abstract display(): void;
}
