import { TAbstractFile, CachedMetadata } from 'obsidian';
import IconizePlugin from '@app/main';
import { FrontmatterRule, FrontmatterRuleCriterion, FrontmatterRuleOperator } from '@app/settings/data';
import { getFileItemTitleEl } from '@app/util';
import config from '@app/config';
import { FileItem } from '@app/@types/obsidian';
import { IconCache } from './icon-cache';
import dom from './util/dom';

export type FrontmatterRuleFileType = 'file' | 'folder';

/**
 * Evaluates a single criterion against a frontmatter value.
 * @param criterion The criterion to evaluate.
 * @param frontmatterValue The value from the frontmatter to compare against.
 * @returns True if the criterion is satisfied, false otherwise.
 */
const evaluateCriterion = (
  criterion: FrontmatterRuleCriterion,
  frontmatterValue: any,
): boolean => {
  const { field, operator, value } = criterion;

  switch (operator) {
    case 'exists':
      return frontmatterValue !== undefined && frontmatterValue !== null;
    
    case 'not-exists':
      return frontmatterValue === undefined || frontmatterValue === null;
    
    case 'equals':
      return frontmatterValue === value;
    
    case 'not-equals':
      return frontmatterValue !== value;
    
    case 'greater-than':
      return typeof frontmatterValue === 'number' && typeof value === 'number' && frontmatterValue > value;
    
    case 'less-than':
      return typeof frontmatterValue === 'number' && typeof value === 'number' && frontmatterValue < value;
    
    case 'greater-equal':
      return typeof frontmatterValue === 'number' && typeof value === 'number' && frontmatterValue >= value;
    
    case 'less-equal':
      return typeof frontmatterValue === 'number' && typeof value === 'number' && frontmatterValue <= value;
    
    case 'contains':
      return typeof frontmatterValue === 'string' && typeof value === 'string' && frontmatterValue.includes(value);
    
    case 'not-contains':
      return typeof frontmatterValue === 'string' && typeof value === 'string' && !frontmatterValue.includes(value);
    
    default:
      return false;
  }
};

/**
 * Checks if the file type matches the rule's target.
 * @param rule The frontmatter rule to check.
 * @param fileType The type of the file being evaluated.
 * @returns True if the rule applies to this file type, false otherwise.
 */
const doesMatchFileType = (
  rule: FrontmatterRule,
  fileType: FrontmatterRuleFileType,
): boolean => {
  return (
    rule.for === 'everything' ||
    (rule.for === 'files' && fileType === 'file') ||
    (rule.for === 'folders' && fileType === 'folder')
  );
};

/**
 * Evaluates all criteria in a frontmatter rule against a file's metadata.
 * @param plugin The plugin instance.
 * @param rule The frontmatter rule to evaluate.
 * @param filePath The path of the file to evaluate.
 * @returns Promise that resolves to true if the rule should be applied, false otherwise.
 */
const isApplicable = async (
  plugin: IconizePlugin,
  rule: FrontmatterRule,
  filePath: string,
): Promise<boolean> => {
  // Check if rule is enabled
  if (rule.enabled === false) {
    return false;
  }

  // Check file type
  const metadata = await plugin.app.vault.adapter.stat(filePath);
  if (!metadata) {
    return false;
  }

  const fileType = metadata.type;
  if (!doesMatchFileType(rule, fileType)) {
    return false;
  }

  // For folders, we don't check frontmatter criteria (folders don't have frontmatter)
  if (fileType === 'folder') {
    return true;
  }

  // Get the file and its cached metadata
  const file = plugin.app.vault.getAbstractFileByPath(filePath);
  if (!file || file instanceof plugin.app.vault.adapter.path.constructor) {
    return false;
  }

  const fileCache = plugin.app.metadataCache.getFileCache(file);
  if (!fileCache || !fileCache.frontmatter) {
    // If no frontmatter, only apply rules that check for non-existence
    return rule.criteria.every(criterion => 
      criterion.operator === 'not-exists' || 
      (criterion.operator === 'exists' && false)
    );
  }

  // Evaluate all criteria (AND logic)
  return rule.criteria.every(criterion => {
    const frontmatterValue = fileCache.frontmatter[criterion.field];
    return evaluateCriterion(criterion, frontmatterValue);
  });
};

/**
 * Gets all the frontmatter rules sorted by their order property in ascending order.
 * @param plugin IconizePlugin instance.
 * @returns FrontmatterRule array sorted by their order property in ascending order.
 */
const getSortedRules = (plugin: IconizePlugin): FrontmatterRule[] => {
  return plugin.getSettings().frontmatterRules
    .filter(rule => rule.enabled !== false)
    .sort((a, b) => a.order - b.order);
};

/**
 * Tries to add the icon from a frontmatter rule to a file or folder.
 * This function respects the priority system and won't override manually set icons.
 * @param plugin IconizePlugin instance.
 * @param rule FrontmatterRule to apply.
 * @param file TAbstractFile to apply the rule to.
 * @param container Optional HTMLElement where the icon will be added.
 * @returns Promise that resolves to true if the icon was added, false otherwise.
 */
const add = async (
  plugin: IconizePlugin,
  rule: FrontmatterRule,
  file: TAbstractFile,
  container?: HTMLElement,
): Promise<boolean> => {
  if (container && dom.doesElementHasIconNode(container)) {
    return false;
  }

  // Check if the file already has a manually set icon or custom rule icon
  const hasIcon = plugin.getIconNameFromPath(file.path);
  if (hasIcon) {
    // Check if the existing icon was set by a frontmatter rule
    const cachedIcon = IconCache.getInstance().get(file.path);
    if (!cachedIcon?.inFrontmatterRule) {
      // Don't override manually set icons or custom rule icons
      return false;
    }
  }

  const doesMatch = await isApplicable(plugin, rule, file.path);
  if (doesMatch) {
    IconCache.getInstance().set(file.path, {
      iconNameWithPrefix: rule.icon,
      inFrontmatterRule: true,
    });
    dom.createIconNode(plugin, file.path, rule.icon, {
      color: rule.color,
      container,
    });
    return true;
  }

  return false;
};

/**
 * Removes icons that were applied by frontmatter rules but no longer meet the criteria.
 * @param plugin IconizePlugin instance.
 * @param rule FrontmatterRule to check.
 */
const removeFromAllFiles = async (
  plugin: IconizePlugin,
  rule: FrontmatterRule,
): Promise<void> => {
  const nodesWithIcon = document.querySelectorAll(
    `[${config.ICON_ATTRIBUTE_NAME}="${rule.icon}"]`,
  );

  for (let i = 0; i < nodesWithIcon.length; i++) {
    const node = nodesWithIcon[i];
    const parent = node.parentElement;
    if (!parent) {
      continue;
    }

    const dataPath = parent.getAttribute('data-path');
    if (!dataPath) {
      continue;
    }

    // Check if this icon was set by a frontmatter rule
    const cachedIcon = IconCache.getInstance().get(dataPath);
    if (!cachedIcon?.inFrontmatterRule) {
      continue;
    }

    // Check if the rule no longer applies
    const stillApplies = await isApplicable(plugin, rule, dataPath);
    if (!stillApplies) {
      dom.removeIconInNode(parent as HTMLElement);
      IconCache.getInstance().invalidate(dataPath);
    }
  }
};

/**
 * Applies frontmatter rules to all files that match the criteria.
 * @param plugin IconizePlugin instance.
 * @param rule FrontmatterRule to apply.
 */
const addToAllFiles = async (
  plugin: IconizePlugin,
  rule: FrontmatterRule,
): Promise<void> => {
  const fileItems = await getFileItems(plugin, rule);
  for (const fileItem of fileItems) {
    await add(plugin, rule, fileItem.file, getFileItemTitleEl(fileItem));
  }
};

/**
 * Gets all file items that match the criteria for a frontmatter rule.
 * @param plugin IconizePlugin instance.
 * @param rule FrontmatterRule to check.
 * @returns Promise that resolves to array of matching file items.
 */
const getFileItems = async (
  plugin: IconizePlugin,
  rule: FrontmatterRule,
): Promise<FileItem[]> => {
  const result: FileItem[] = [];
  for (const fileExplorer of plugin.getRegisteredFileExplorers()) {
    const files = Object.values(fileExplorer.fileItems || {});
    for (const fileItem of files) {
      if (await isApplicable(plugin, rule, fileItem.file.path)) {
        result.push(fileItem);
      }
    }
  }
  return result;
};

/**
 * Evaluates and updates icons for a specific file based on all frontmatter rules.
 * This is typically called when a file's frontmatter changes.
 * @param plugin IconizePlugin instance.
 * @param filePath Path of the file to evaluate.
 */
const evaluateFileRules = async (
  plugin: IconizePlugin,
  filePath: string,
): Promise<void> => {
  if (!plugin.getSettings().frontmatterRulesEnabled) {
    return;
  }

  const cachedIcon = IconCache.getInstance().get(filePath);
  
  // If there's a manually set icon or custom rule icon, don't interfere
  if (cachedIcon && !cachedIcon.inFrontmatterRule) {
    return;
  }

  const rules = getSortedRules(plugin);
  let ruleApplied = false;

  // Find the first applicable rule (highest priority)
  for (const rule of rules) {
    if (await isApplicable(plugin, rule, filePath)) {
      // Check if we need to update the icon
      const currentIcon = cachedIcon?.iconNameWithPrefix;
      if (currentIcon !== rule.icon) {
        // Remove current icon if it exists
        if (currentIcon) {
          const node = document.querySelector(`[data-path="${filePath}"]`);
          if (node) {
            dom.removeIconInNode(node);
          }
        }
        
        // Apply new icon
        IconCache.getInstance().set(filePath, {
          iconNameWithPrefix: rule.icon,
          inFrontmatterRule: true,
        });
        dom.createIconNode(plugin, filePath, rule.icon, {
          color: rule.color,
        });
      }
      ruleApplied = true;
      break;
    }
  }

  // If no rule applies but there was a frontmatter rule icon, remove it
  if (!ruleApplied && cachedIcon?.inFrontmatterRule) {
    const node = document.querySelector(`[data-path="${filePath}"]`);
    if (node) {
      dom.removeIconInNode(node);
    }
    IconCache.getInstance().invalidate(filePath);
  }
};

export default {
  evaluateCriterion,
  doesMatchFileType,
  isApplicable,
  getSortedRules,
  add,
  removeFromAllFiles,
  addToAllFiles,
  getFileItems,
  evaluateFileRules,
}; 