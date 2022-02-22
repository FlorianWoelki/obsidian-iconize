import { TFile, View, WorkspaceLeaf } from 'obsidian';

declare module 'obsidian' {
  interface Workspace {
    getLeavesOfType(viewType: 'search' | 'file-explorer'): ExplorerLeaf[];
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
  dom: { children: DomChild[]; changed: () => void };
}

interface FileItem {
  titleEl: HTMLDivElement;
  titleInnerEl: HTMLDivElement;
}
