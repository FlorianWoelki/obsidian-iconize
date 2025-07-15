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
      const numFrontmatter1 = typeof frontmatterValue === 'string' ? parseFloat(frontmatterValue) : 
                              typeof frontmatterValue === 'number' ? frontmatterValue : NaN;
      const numValue1 = typeof value === 'string' ? parseFloat(value) : 
                        typeof value === 'number' ? value : NaN;
      return !isNaN(numFrontmatter1) && !isNaN(numValue1) && numFrontmatter1 > numValue1;
    case 'less-than':
      const numFrontmatter2 = typeof frontmatterValue === 'string' ? parseFloat(frontmatterValue) : 
                              typeof frontmatterValue === 'number' ? frontmatterValue : NaN;
      const numValue2 = typeof value === 'string' ? parseFloat(value) : 
                        typeof value === 'number' ? value : NaN;
      return !isNaN(numFrontmatter2) && !isNaN(numValue2) && numFrontmatter2 < numValue2;
    case 'greater-equal':
      const numFrontmatter3 = typeof frontmatterValue === 'string' ? parseFloat(frontmatterValue) : 
                              typeof frontmatterValue === 'number' ? frontmatterValue : NaN;
      const numValue3 = typeof value === 'string' ? parseFloat(value) : 
                        typeof value === 'number' ? value : NaN;
      return !isNaN(numFrontmatter3) && !isNaN(numValue3) && numFrontmatter3 >= numValue3;
    case 'less-equal':
      const numFrontmatter4 = typeof frontmatterValue === 'string' ? parseFloat(frontmatterValue) : 
                              typeof frontmatterValue === 'number' ? frontmatterValue : NaN;
      const numValue4 = typeof value === 'string' ? parseFloat(value) : 
                        typeof value === 'number' ? value : NaN;
      return !isNaN(numFrontmatter4) && !isNaN(numValue4) && numFrontmatter4 <= numValue4;
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
    console.log('[Frontmatter Rules] No frontmatter found for', filePath);
    return rule.criteria.every(criterion => criterion.operator === 'not-exists');
  }

  console.log('[Frontmatter Rules] Frontmatter found:', fileCache.frontmatter);

  return rule.criteria.every(criterion => {
    const frontmatterValue = fileCache.frontmatter[criterion.field];
    console.log('[Frontmatter Rules] Checking field:', criterion.field, 'value:', frontmatterValue, 'operator:', criterion.operator, 'against:', criterion.value);
    const result = evaluateCriterion(criterion, frontmatterValue);
    console.log('[Frontmatter Rules] Criterion result:', result);
    return result;
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
  console.log('[Frontmatter Rules] Evaluating file:', filePath);
  
  if (!plugin.getSettings().frontmatterRulesEnabled) {
    console.log('[Frontmatter Rules] Feature is disabled');
    return;
  }
  
  console.log('[Frontmatter Rules] Feature is enabled');

  const cachedIcon = IconCache.getInstance().get(filePath);
  
  if (cachedIcon && !cachedIcon.inFrontmatterRule) {
    return;
  }

  const rules = getSortedRules(plugin);
  console.log('[Frontmatter Rules] Found', rules.length, 'rules');
  let ruleApplied = false;

  for (const rule of rules) {
    console.log('[Frontmatter Rules] Checking rule:', rule.name, 'for field:', rule.criteria[0]?.field);
    const applicable = await isApplicable(plugin, rule, filePath);
    console.log('[Frontmatter Rules] Rule', rule.name, 'applicable:', applicable);
    
    if (applicable) {
      const currentIcon = cachedIcon?.iconNameWithPrefix;
      if (currentIcon !== rule.icon) {
        if (currentIcon) {
          const node = document.querySelector(`[data-path="${filePath}"]`);
          if (node) {
            dom.removeIconInNode(node as HTMLElement);
          }
        }
        
        try {
          IconCache.getInstance().set(filePath, {
            iconNameWithPrefix: rule.icon,
            inFrontmatterRule: true,
          });
          dom.createIconNode(plugin, filePath, rule.icon, {
            color: rule.color,
          });
        } catch (e) {
          console.warn(`Failed to apply frontmatter rule icon for ${filePath}: ${e.message}`);
          continue; // Try next rule
        }
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