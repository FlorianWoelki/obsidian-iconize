export interface ExtraMarginSettings {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface CustomRule {
  rule: string;
  icon: string;
  order: number;
  color?: string;
  useFilePath?: boolean;
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
  migrated: 2, // Bump up this number for migrations.
  iconPacksPath: '.obsidian/icons', // Set to `.obsidian/icons` for to improve overall performance for Obsidian Sync.
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
