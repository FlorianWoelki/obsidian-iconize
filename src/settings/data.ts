export type EmojiStyle = 'native' | 'twemoji';

export enum IconInTitlePosition {
  Above = 'above',
  Inline = 'inline',
}

export type LucideIconPackType = 'none' | 'custom' | 'native';

export interface ExtraMarginSettings {
  /**
   * Controls the extra margin on the top of the icon.
   * @default 0
   */
  top?: number;
  /**
   * Controls the extra margin on the right of the icon.
   * @default 4
   */
  right?: number;
  /**
   * Controls the extra margin on the bottom of the icon.
   * @default 0
   */
  bottom?: number;
  /**
   * Controls the extra margin on the left of the icon.
   * @default 0
   */
  left?: number;
}

export interface CustomRule {
  /**
   * Sets the actual rule of the custom rule. This can be in the form of a regex or a
   * string.
   */
  rule: string;
  /**
   * Sets the icon of the custom rule.
   */
  icon: string;
  /**
   * Controls the order of the custom rule. The lower the number, the more prioritized
   * the rule is. If two rules have the same order, the rule which was added first will
   * be prioritized.
   */
  order: number;
  /**
   * Sets the color of the icon for the custom rule. Setting this option to `null` will
   * use the default color of the theme.
   * @default null
   */
  color?: string;
  /**
   * Controls whether the rule should be applied to the whole file path or the file name.
   * @default false
   */
  useFilePath?: boolean;
  /**
   * Controls whether the rule should be applied to files, folders or both.
   * @default 'everything'
   */
  for?: 'everything' | 'files' | 'folders';
}

export type FrontmatterRuleOperator = 
  | 'equals' 
  | 'not-equals' 
  | 'greater-than' 
  | 'less-than' 
  | 'greater-equal' 
  | 'less-equal' 
  | 'contains' 
  | 'not-contains' 
  | 'exists' 
  | 'not-exists';

export interface FrontmatterRuleCriterion {
  /**
   * The frontmatter field name to evaluate.
   */
  field: string;
  /**
   * The operator to use for comparison.
   */
  operator: FrontmatterRuleOperator;
  /**
   * The value to compare against (not used for 'exists' and 'not-exists' operators).
   */
  value?: string | number | boolean;
}

export interface FrontmatterRule {
  /**
   * A descriptive name for this rule.
   */
  name: string;
  /**
   * The icon to apply when criteria are met.
   */
  icon: string;
  /**
   * The color of the icon. Setting to null uses default theme color.
   * @default null
   */
  color?: string;
  /**
   * Controls the priority of the rule. Lower numbers have higher priority.
   */
  order: number;
  /**
   * Whether this rule is currently enabled.
   * @default true
   */
  enabled?: boolean;
  /**
   * Controls whether the rule should be applied to files, folders or both.
   * @default 'files'
   */
  for?: 'everything' | 'files' | 'folders';
  /**
   * The criteria that must be met for this rule to apply.
   * All criteria must be satisfied (AND logic).
   */
  criteria: FrontmatterRuleCriterion[];
}

export interface IconFolderSettings {
  /**
   * The version of the settings which is used for migrations. This number should be
   * bumped up for every migration.
   */
  migrated: number;
  /**
   * Sets the path of where the icon packs are located and stored.
   * @default '.obsidian/icons'
   */
  iconPacksPath: string;
  /**
   * Controls the font size of the icons.
   * @default 16
   */
  fontSize: number;
  /**
   * Sets the style of the emoji. The option `none` means that no emojis will be used.
   * @default 'native'
   */
  emojiStyle: EmojiStyle;
  /**
   * Sets the overall color of all the icons. Setting this option to `null` will use the
   * default color of the theme.
   * @default null
   */
  iconColor: string | null;
  /**
   * Controls the extra margin around the icon.
   * @see ExtraMarginSettings
   */
  extraMargin: ExtraMarginSettings;
  /**
   * Stores the recently used icons.
   * @default []
   */
  recentlyUsedIcons: string[];
  /**
   * Controls the size of the recently used icons list which are displayed in the icon
   * picker.
   * @default 5
   */
  recentlyUsedIconsSize: number;
  /**
   * Stores the custom rules.
   * @see CustomRule
   * @default []
   */
  rules: CustomRule[];
  /**
   * Sets whether the plugin should manage icons automatically based on frontmatter rules.
   * @default false
   */
  frontmatterRulesEnabled: boolean;
  /**
   * Stores the frontmatter-based rules for automatic icon management.
   * @see FrontmatterRule
   * @default []
   */
  frontmatterRules: FrontmatterRule[];
  /**
   * Sets whether the plugin should show icons in the tabs when you open a file in your
   * vault. When no icon is set for the file, it will use the default file icon from
   * Obsidian.
   * @default false
   */
  iconInTabsEnabled: boolean;
  /**
   * Sets whether the plugin should show icons in the inline title of the currently open
   * file.
   * @default false
   */
  iconInTitleEnabled: boolean;
  /**
   * Sets the default position of the icon in the title of a file.
   * @default 'above'
   */
  iconInTitlePosition: IconInTitlePosition;
  /**
   * Sets whether the plugin should check in the background if icons are missing.
   * @default false
   */
  iconsBackgroundCheckEnabled: boolean;
  /**
   * Sets whether the plugin should add icons based on the `icon` frontmatter attribute.
   * @default false
   */
  iconInFrontmatterEnabled: boolean;
  /**
   * Sets the name of the frontmatter field which contains the icon.
   * @default 'icon'
   */
  iconInFrontmatterFieldName: string;
  /**
   * Sets the name of the frontmatter field which contains the color of the icon.
   * @default 'iconColor'
   */
  iconColorInFrontmatterFieldName: string;
  /**
   * Sets whether the plugin should be able to show icons in the editor while
   * editing notes.
   * @default true
   */
  iconsInNotesEnabled: boolean;
  /**
   * Sets whether the plugin should be able to show icons in the links.
   * @default true
   */
  iconsInLinksEnabled: boolean;
  /**
   * Sets the icon identifier used in notes.
   * @default ':'
   */
  iconIdentifier: string;
  /**
   * Specifies which Lucide icon pack to use.
   * - 'none': Don't use any Lucide icon pack
   * - 'native': Use the native Lucide icon pack
   * - 'custom': Use a custom Lucide icon pack
   * @default 'native'
   */
  lucideIconPackType: LucideIconPackType;
  /**
   * Sets whether the plugin should be in debug mode. This will enable more logging
   * in the console.
   */
  debugMode?: boolean;
  /**
   * Adds icons to internal plugins such as the bookmarks and outline plugins.
   * This is experimental.
   * @default false
   */
  useInternalPlugins?: boolean;
}

export const DEFAULT_SETTINGS: IconFolderSettings = {
  migrated: 2,
  iconPacksPath: '.obsidian/icons',
  fontSize: 16,
  emojiStyle: 'native',
  iconColor: null,
  recentlyUsedIcons: [],
  recentlyUsedIconsSize: 5,
  rules: [],
  frontmatterRulesEnabled: true,
  frontmatterRules: [
    {
      name: 'Example: Quality Score (High)', // Example rule - you can modify or delete this
      icon: 'libookmark', // The icon to display
      order: 1,
      enabled: false, // Disabled by default - users can enable if they want this example
      for: 'files', // Apply to files
      criteria: [
        {
          field: 'Quality Score', // Example field name - change to match your frontmatter
          operator: 'greater-than',
          value: 1,
        },
      ],
    },
    {
      name: 'Example: Priority (High)', // Another example rule
      icon: 'liflag', // Different icon for variety
      order: 2,
      enabled: false, // Disabled by default
      for: 'files',
      criteria: [
        {
          field: 'Priority', // Example field name
          operator: 'equals',
          value: 'High',
        },
      ],
    },
    {
      name: 'Example: Status (Complete)', // Third example rule
      icon: 'lischeck-circle', // Checkmark icon
      order: 3,
      enabled: false, // Disabled by default
      for: 'files',
      criteria: [
        {
          field: 'Status', // Example field name
          operator: 'equals',
          value: 'Complete',
        },
      ],
    },
  ],
  extraMargin: {
    top: 0,
    right: 4,
    bottom: 0,
    left: 0,
  },
  iconInTabsEnabled: false,
  iconInTitleEnabled: false,
  iconInTitlePosition: IconInTitlePosition.Above,
  iconInFrontmatterEnabled: false,
  iconInFrontmatterFieldName: 'icon',
  iconColorInFrontmatterFieldName: 'iconColor',
  iconsBackgroundCheckEnabled: false,
  iconsInNotesEnabled: true,
  iconsInLinksEnabled: true,
  iconIdentifier: ':',
  lucideIconPackType: 'native',
  debugMode: false,
  useInternalPlugins: false,
};
