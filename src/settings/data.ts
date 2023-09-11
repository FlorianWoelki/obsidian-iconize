export interface ExtraMarginSettings {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface CustomRule {
  rule: string;
  icon: string;
  color?: string;
  useFilePath?:boolean;
  for?: 'everything' | 'files' | 'folders';
}

export interface IconFolderSettings {
  migrated: number;
  iconPacksPath: string;
  fontSize: number;
  emojiStyle: 'none' | 'native' | 'twemoji';
  iconColor: string | null;
  extraMargin: ExtraMarginSettings;
  recentlyUsedIcons: string[];
  recentlyUsedIconsSize: number;
  rules: CustomRule[];
  iconInTabsEnabled: boolean;
}

export const DEFAULT_SETTINGS: IconFolderSettings = {
  migrated: 1,
  iconPacksPath: '.obsidian/plugins/obsidian-icon-folder/icons',
  fontSize: 16,
  emojiStyle: 'none',
  iconColor: null,
  recentlyUsedIcons: [],
  recentlyUsedIconsSize: 5,
  rules: [],
  extraMargin: {
    top: 0,
    right: 4,
    bottom: 0,
    left: 0,
  },
  iconInTabsEnabled: false,
};
