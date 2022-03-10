export interface ExtraPaddingSettings {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface IconFolderSettings {
  fontSize: number;
  iconColor: string | null;
  extraPadding: ExtraPaddingSettings;
  recentlyUsedIcons: string[];
  recentlyUsedIconsSize: number;
}

export const DEFAULT_SETTINGS: IconFolderSettings = {
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
