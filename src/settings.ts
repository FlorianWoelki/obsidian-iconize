export interface ExtraPaddingSettings {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface IconFolderSettings {
  migrated: boolean;
  iconPacksPath: string;
  fontSize: number;
  iconColor: string | null;
  extraPadding: ExtraPaddingSettings;
  recentlyUsedIcons: string[];
  recentlyUsedIconsSize: number;
}

export const DEFAULT_SETTINGS: IconFolderSettings = {
  migrated: false,
  iconPacksPath: 'plugins/obsidian-icon-folder/icons',
  fontSize: 16,
  iconColor: null,
  recentlyUsedIcons: [],
  recentlyUsedIconsSize: 5,
  extraPadding: {
    top: 2,
    right: 2,
    bottom: 2,
    left: 2,
  },
};
