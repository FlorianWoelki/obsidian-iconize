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
  for?: 'everything' | 'files' | 'folders';
}

export interface IconFolderSettings {
  migrated: boolean;
  iconPacksPath: string;
  fontSize: number;
  iconColor: string | null;
  extraMargin: ExtraMarginSettings;
  recentlyUsedIcons: string[];
  recentlyUsedIconsSize: number;
  rules: CustomRule[];
}

export const DEFAULT_SETTINGS: IconFolderSettings = {
  migrated: false,
  iconPacksPath: '.obsidian/plugins/obsidian-icon-folder/icons',
  fontSize: 16,
  iconColor: null,
  recentlyUsedIcons: [],
  recentlyUsedIconsSize: 5,
  rules: [],
  extraMargin: {
    top: 0,
    right: 2,
    bottom: 0,
    left: 0,
  },
};
