import { TAbstractFile } from 'obsidian';
import IconizePlugin from '@app/main';
import { FrontmatterRule, FrontmatterRuleCriterion } from '@app/settings/data';
import { getFileItemTitleEl } from '@app/util';
import { FileItem } from '@app/@types/obsidian';
import { IconCache } from './icon-cache';
import dom from './util/dom';

export type FrontmatterRuleFileType = 'file' | 'folder';

/**
 * Evaluates a single criterion against a frontmatter value.
 */
const evaluateCriterion = (
  criterion: FrontmatterRuleCriterion,
  frontmatterValue: any,
): boolean => {
  const { operator, value } = criterion;

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
 */
const isApplicable = async (
  plugin: IconizePlugin,
  rule: FrontmatterRule,
  filePath: string,
): Promise<boolean> => {
  if (rule.enabled === false) {
    return false;
  }

  const metadata = await plugin.app.vault.adapter.stat(filePath);
  if (!metadata) {
    return false;
  }

  const fileType = metadata.type;
  if (!doesMatchFileType(rule, fileType)) {
    return false;
  }

  if (fileType === 'folder') {
    return true;
  }

  const file = plugin.app.vault.getAbstractFileByPath(filePath);
  if (!file || file.path !== filePath) {
    return false;
  }

  const fileCache = plugin.app.metadataCache.getFileCache(file as any);
  if (!fileCache || !fileCache.frontmatter) {
    return rule.criteria.every(criterion => criterion.operator === 'not-exists');
  }

  return rule.criteria.every(criterion => {
    const frontmatterValue = fileCache.frontmatter[criterion.field];
    return evaluateCriterion(criterion, frontmatterValue);
  });
};

/**
 * Gets all the frontmatter rules sorted by their order property.
 */
const getSortedRules = (plugin: IconizePlugin): FrontmatterRule[] => {
  return plugin.getSettings().frontmatterRules
    .filter(rule => rule.enabled !== false)
    .sort((a, b) => a.order - b.order);
};

/**
 * Tries to add the icon from a frontmatter rule to a file or folder.
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

  const hasIcon = plugin.getIconNameFromPath(file.path);
  if (hasIcon) {
    const cachedIcon = IconCache.getInstance().get(file.path);
    if (!cachedIcon?.inFrontmatterRule) {
      return false;
    }
  }

  const doesMatch = await isApplicable(plugin, rule, file.path);
  if (doesMatch) {
    try {
      IconCache.getInstance().set(file.path, {
        iconNameWithPrefix: rule.icon,
        inFrontmatterRule: true,
      });
      dom.createIconNode(plugin, file.path, rule.icon, {
        color: rule.color,
        container,
      });
      return true;
    } catch (e) {
      console.warn(`Failed to apply frontmatter rule icon for ${file.path}: ${e.message}`);
      return false;
    }
  }

  return false;
};

/**
 * Applies frontmatter rules to all files that match the criteria.
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
 */
const getFileItems = async (
  plugin: IconizePlugin,
  rule: FrontmatterRule,
): Promise<FileItem[]> => {
  const result: FileItem[] = [];
  for (const fileExplorer of plugin.getRegisteredFileExplorers()) {
    const fileItems = fileExplorer.fileItems || {};
    for (const filePath in fileItems) {
      const fileItem = fileItems[filePath];
      if (await isApplicable(plugin, rule, fileItem.file.path)) {
        result.push(fileItem);
      }
    }
  }
  return result;
};

/**
 * Evaluates and updates icons for a specific file based on all frontmatter rules.
 */
const evaluateFileRules = async (
  plugin: IconizePlugin,
  filePath: string,
): Promise<void> => {
  if (!plugin.getSettings().frontmatterRulesEnabled) {
    return;
  }

  const cachedIcon = IconCache.getInstance().get(filePath);
  
  if (cachedIcon && !cachedIcon.inFrontmatterRule) {
    return;
  }

  const rules = getSortedRules(plugin);
  let ruleApplied = false;

  for (const rule of rules) {
    if (await isApplicable(plugin, rule, filePath)) {
      const currentIcon = cachedIcon?.iconNameWithPrefix;
      if (currentIcon !== rule.icon) {
        if (currentIcon) {
          const node = document.querySelector(`[data-path="${filePath}"]`);
          if (node) {
            dom.removeIconInNode(node as HTMLElement);
          }
        }
        
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

  if (!ruleApplied && cachedIcon?.inFrontmatterRule) {
    const node = document.querySelector(`[data-path="${filePath}"]`);
    if (node) {
      dom.removeIconInNode(node as HTMLElement);
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
  addToAllFiles,
  getFileItems,
  evaluateFileRules,
}; 