import { TFile, View, WorkspaceLeaf } from 'obsidian';

interface InternalPlugin {
  enabled: boolean;
  enable: (b: boolean) => void;
  disable: (b: boolean) => void;
}

interface StarredFile {
  type: 'file';
  title: string;
  path: string;
}

interface StarredInternalPlugin extends InternalPlugin {
  instance: {
    addItem: (file: StarredFile) => void;
    removeItem: (file: StarredFile) => void;
    items: StarredFile[];
  };
}

interface FileExplorerInternalPlugin extends InternalPlugin {}

interface InternalPlugins {
  starred: StarredInternalPlugin;
  'file-explorer': FileExplorerInternalPlugin;
}

declare module 'obsidian' {
  interface Workspace {
    getLeavesOfType(viewType: 'markdown' | 'search' | 'file-explorer'): ExplorerLeaf[];
  }

  interface App {
    internalPlugins: {
      plugins: InternalPlugins;
      getPluginById<T extends keyof InternalPlugins>(id: T): InternalPlugins[T];
      loadPlugin(...args: any[]): any;
    };
  }
}

interface ExplorerLeaf extends WorkspaceLeaf {
  view: ExplorerView;
}

interface DomChild {
  file: TFile;
  collapseEl: HTMLElement;
  containerEl: HTMLElement;
}

interface ExplorerView extends View {
  fileItems: Record<string, FileItem>; // keyed by path
  ready: boolean; // true if fileItems is populated
  file?: TFile;
  dom: { children: DomChild[]; changed: () => void };
}

interface FileItem {
  titleEl: HTMLDivElement;
  titleInnerEl: HTMLDivElement;
}
