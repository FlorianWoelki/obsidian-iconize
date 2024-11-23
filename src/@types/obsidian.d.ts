import IconizeAPI from '@app/lib/api';
import {
  Editor,
  TAbstractFile,
  TFile,
  View,
  ViewState,
  WorkspaceLeaf,
} from 'obsidian';

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

interface BookmarkItem {
  ctime: number;
  type: 'file' | 'folder' | 'group';
  path: string;
  title: string;
  items?: BookmarkItem[];
}

interface BookmarkItemValue {
  el: HTMLElement;
  item: BookmarkItem;
}

interface BookmarkInternalPlugin extends InternalPlugin {
  instance: {
    addItem: (file: BookmarkItem) => void;
    removeItem: (file: BookmarkItem) => void;
    items: BookmarkItem[];
  };
}

interface OutlineInternalPlugin extends InternalPlugin {}

type FileExplorerInternalPlugin = InternalPlugin;

interface InternalPlugins {
  starred: StarredInternalPlugin;
  bookmarks: BookmarkInternalPlugin;
  'file-explorer': FileExplorerInternalPlugin;
  outline: OutlineInternalPlugin;
}

declare module 'obsidian' {
  interface Workspace {
    getLeavesOfType(
      viewType: 'markdown' | 'search' | 'file-explorer',
    ): ExplorerLeaf[];
  }

  interface App {
    plugins: {
      enabledPlugins: Set<string>;
      plugins: {
        ['obsidian-icon-folder']?: {
          api: IconizeAPI;
        };
      };
    };
    internalPlugins: {
      plugins: InternalPlugins;
      getPluginById<T extends keyof InternalPlugins>(id: T): InternalPlugins[T];
      loadPlugin(...args: any[]): any;
    };
  }
}

type FileWithLeaf = TFile & { leaf: ExplorerLeaf; pinned: boolean };

interface ExplorerLeaf extends WorkspaceLeaf {
  view: ExplorerView;
}

interface TabHeaderLeaf extends ExplorerLeaf {
  tabHeaderEl: HTMLElement;
  tabHeaderInnerIconEl: HTMLElement;
}

interface DomChild {
  file: TFile;
  collapseEl: HTMLElement;
  containerEl: HTMLElement;
}

interface ExplorerViewState extends ViewState {
  state: {
    source: boolean; // true if source view is active
  };
}

interface ExplorerView extends View {
  fileItems: Record<string, FileItem>; // keyed by path
  ready: boolean; // true if fileItems is populated
  file?: TFile;
  getViewState(): ExplorerViewState;
  getMode(): 'source' | 'preview';
  dom: { children: DomChild[]; changed: () => void };
}

interface InlineTitleView extends ExplorerView {
  inlineTitleEl: HTMLElement;
}

interface FileItem {
  /**
   * @deprecated After Obsidian 1.2.0, use `selfEl` instead.
   */
  titleEl?: HTMLDivElement;
  /**
   * @deprecated After Obsidian 1.2.0, use `innerEl` instead.
   */
  titleInnerEl?: HTMLDivElement;
  selfEl: HTMLDivElement;
  innerEl: HTMLDivElement;
  file: TAbstractFile;
}

interface EditorWithEditorComponent extends Editor {
  editorComponent?: {
    file?: TFile;
  };
}
