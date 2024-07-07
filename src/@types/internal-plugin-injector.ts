import { TAbstractFile, View, WorkspaceLeaf } from 'obsidian';
import IconizePlugin from '@app/main';

interface FileExplorerWorkspaceLeaf extends WorkspaceLeaf {
  containerEl: HTMLElement;
  view: FileExplorerView;
}

interface FileExplorerView extends View {
  fileItems: { [path: string]: TAbstractFile };
}

export default abstract class InternalPluginInjector {
  protected plugin: IconizePlugin;

  constructor(plugin: IconizePlugin) {
    this.plugin = plugin;
  }

  get fileExplorers(): FileExplorerWorkspaceLeaf[] {
    return this.plugin.app.workspace.getLeavesOfType(
      'file-explorer',
    ) as unknown as FileExplorerWorkspaceLeaf[];
  }

  onMount(): void {}

  abstract get enabled(): boolean;

  abstract register(): void;
}
