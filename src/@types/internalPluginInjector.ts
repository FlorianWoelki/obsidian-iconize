import { TAbstractFile, View, WorkspaceLeaf } from 'obsidian';
import IconFolderPlugin from '@app/main';

interface FileExplorerWorkspaceLeaf extends WorkspaceLeaf {
  containerEl: HTMLElement;
  view: FileExplorerView;
}

interface FileExplorerView extends View {
  fileItems: { [path: string]: TAbstractFile };
}

export default abstract class InternalPluginInjector {
  protected plugin: IconFolderPlugin;

  constructor(plugin: IconFolderPlugin) {
    this.plugin = plugin;
  }

  get fileExplorers(): FileExplorerWorkspaceLeaf[] {
    return this.plugin.app.workspace.getLeavesOfType(
      'file-explorer',
    ) as unknown as FileExplorerWorkspaceLeaf[];
  }

  // eslint-disable-next-line
  onMount(): void {}

  abstract get enabled(): boolean;

  abstract register(): void;
}
