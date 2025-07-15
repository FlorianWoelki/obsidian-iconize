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

  const frontmatterNumber = typeof frontmatterValue === 'number' ? frontmatterValue : parseFloat(frontmatterValue as string);
  const valueNumber = typeof value === 'number' ? value : parseFloat(value as string);

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
      if (!isNaN(frontmatterNumber) && !isNaN(valueNumber)) {
        return frontmatterNumber > valueNumber;
      }
      return false;
    case 'less-than':
      if (!isNaN(frontmatterNumber) && !isNaN(valueNumber)) {
        return frontmatterNumber < valueNumber;
      }
      return false;
    case 'greater-equal':
      if (!isNaN(frontmatterNumber) && !isNaN(valueNumber)) {
        return frontmatterNumber >= valueNumber;
      }
      return false;
    case 'less-equal':
      if (!isNaN(frontmatterNumber) && !isNaN(valueNumber)) {
        return frontmatterNumber <= valueNumber;
      }
      return false;
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
    console.log('[Frontmatter Rules] File not found:', filePath);
    return false;
  }

  console.log('[Frontmatter Rules] File found:', file.path, 'type:', file.constructor.name);
  const fileCache = plugin.app.metadataCache.getFileCache(file as any);
  console.log('[Frontmatter Rules] File cache:', fileCache ? 'exists' : 'null');
  
  if (!fileCache || !fileCache.frontmatter) {
    console.log('[Frontmatter Rules] No frontmatter found for', filePath, 'fileCache exists:', !!fileCache);
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
  console.log(`[Iconize] Evaluating file for frontmatter rules: ${filePath}`);

  if (!plugin.getSettings().frontmatterRulesEnabled) {
    console.log('[Iconize] Frontmatter rules are disabled in settings.');
    return;
  }

  const file = plugin.app.vault.getAbstractFileByPath(filePath);
  if (!file) {
    console.log(`[Iconize] Could not find file: ${filePath}`);
    return;
  }

  const rules = getSortedRules(plugin);
  if (rules.length === 0) {
    console.log('[Iconize] No enabled frontmatter rules found.');
    return;
  }

  console.log(`[Iconize] Checking ${rules.length} frontmatter rules for ${filePath}...`);

  let ruleApplied = false;

  for (const rule of rules) {
    const applicable = await isApplicable(plugin, rule, filePath);
    console.log(`[Iconize] Rule "${rule.name}" applicable: ${applicable}`);

    if (applicable) {
      console.log(`[Iconize] Applying rule "${rule.name}" to ${filePath}`);
      const cachedIcon = IconCache.getInstance().get(filePath);

      if (cachedIcon?.iconNameWithPrefix !== rule.icon) {
        console.log(`[Iconize] Icon changed from "${cachedIcon?.iconNameWithPrefix}" to "${rule.icon}". Updating DOM.`);
        IconCache.getInstance().set(filePath, {
          iconNameWithPrefix: rule.icon,
          inFrontmatterRule: true,
          iconColor: rule.color,
        });

        // Update the DOM.
        const fileItem = document.querySelector(`[data-path="${filePath}"]`);
        if (fileItem) {
          dom.removeIconInNode(fileItem as HTMLElement);
          dom.createIconNode(plugin, filePath, rule.icon, { container: fileItem as HTMLElement, color: rule.color });
          console.log(`[Iconize] Successfully applied icon "${rule.icon}" to DOM element for ${filePath}.`);
        } else {
          console.log(`[Iconize] Could not find DOM element for ${filePath} to apply icon.`);
        }
      } else {
        console.log(`[Iconize] Icon "${rule.icon}" is already set and cached. No DOM change needed.`);
      }

      ruleApplied = true;
      break; // Stop after first matching rule.
    }
  }

  if (!ruleApplied) {
    console.log(`[Iconize] No frontmatter rules were applicable to ${filePath}.`);
    const cachedIcon = IconCache.getInstance().get(filePath);
    if (cachedIcon?.inFrontmatterRule) {
      console.log(`[Iconize] Removing previously set frontmatter rule icon for ${filePath}.`);
      const fileItem = document.querySelector(`[data-path="${filePath}"]`);
      if (fileItem) {
        dom.removeIconInNode(fileItem as HTMLElement);
      }
      IconCache.getInstance().invalidate(filePath);
    }
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