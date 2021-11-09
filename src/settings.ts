export interface ExtraPaddingSettings {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface IconFolderSettings {
  enableRemixiconsLine: boolean;
  enableRemixiconsFill: boolean;
  enableFontawesomeFill: boolean;
  enableFontawesomeLine: boolean;
  enableFontawesomeBrands: boolean;
  fontSize: number;
  iconColor: string | null;
  extraPadding: ExtraPaddingSettings;
}

export const DEFAULT_SETTINGS: IconFolderSettings = {
  enableRemixiconsLine: true,
  enableRemixiconsFill: false,
  enableFontawesomeFill: false,
  enableFontawesomeLine: false,
  enableFontawesomeBrands: false,
  fontSize: 16,
  iconColor: null,
  extraPadding: {
    top: 2,
    right: 2,
    bottom: 2,
    left: 2,
  },
};
