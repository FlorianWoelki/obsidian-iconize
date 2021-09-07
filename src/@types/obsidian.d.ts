import { View, WorkspaceLeaf } from 'obsidian';

declare module 'obsidian' {
  interface Workspace {
    getLeavesOfType(viewType: 'file-explorer'): ExplorerLeaf[];
  }
}

interface ExplorerLeaf extends WorkspaceLeaf {
  view: ExplorerView;
}

interface ExplorerView extends View {
  fileItems: Record<string, FileItem>; // keyed by path
  ready: boolean; // true if fileItems is populated
}

interface FileItem {
  titleEl: HTMLDivElement;
  titleInnerEl: HTMLDivElement;
}
