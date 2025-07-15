import { describe, it, expect } from 'vitest';
import frontmatterRule from './frontmatter-rule';
import { FrontmatterRuleCriterion } from '@app/settings/data';

describe('evaluateCriterion', () => {
  it('should return true for "greater-than" when the frontmatter value is greater', () => {
    const criterion: FrontmatterRuleCriterion = { field: 'quality', operator: 'greater-than', value: 5 };
    expect(frontmatterRule.evaluateCriterion(criterion, 10)).toBe(true);
  });

  it('should return false for "greater-than" when the frontmatter value is not greater', () => {
    const criterion: FrontmatterRuleCriterion = { field: 'quality', operator: 'greater-than', value: 5 };
    expect(frontmatterRule.evaluateCriterion(criterion, 5)).toBe(false);
    expect(frontmatterRule.evaluateCriterion(criterion, 4)).toBe(false);
  });

  it('should handle string numbers for "greater-than"', () => {
    const criterion: FrontmatterRuleCriterion = { field: 'quality', operator: 'greater-than', value: '5' };
    expect(frontmatterRule.evaluateCriterion(criterion, '10')).toBe(true);
  });

  it('should return true for "less-than" when the frontmatter value is less', () => {
    const criterion: FrontmatterRuleCriterion = { field: 'quality', operator: 'less-than', value: 5 };
    expect(frontmatterRule.evaluateCriterion(criterion, 4)).toBe(true);
  });

  it('should return false for "less-than" when the frontmatter value is not less', () => {
    const criterion: FrontmatterRuleCriterion = { field: 'quality', operator: 'less-than', value: 5 };
    expect(frontmatterRule.evaluateCriterion(criterion, 5)).toBe(false);
    expect(frontmatterRule.evaluateCriterion(criterion, 6)).toBe(false);
  });

  it('should handle string numbers for "less-than"', () => {
    const criterion: FrontmatterRuleCriterion = { field: 'quality', operator: 'less-than', value: '5' };
    expect(frontmatterRule.evaluateCriterion(criterion, '4')).toBe(true);
  });

  it('should return true for "equals" when values are equal', () => {
    const criterion: FrontmatterRuleCriterion = { field: 'quality', operator: 'equals', value: 5 };
    expect(frontmatterRule.evaluateCriterion(criterion, 5)).toBe(true);
  });

  it('should return false for "equals" when values are not equal', () => {
    const criterion: FrontmatterRuleCriterion = { field: 'quality', operator: 'equals', value: 5 };
    expect(frontmatterRule.evaluateCriterion(criterion, 6)).toBe(false);
  });

  it('should handle "exists" and "not-exists"', () => {
    const existsCriterion: FrontmatterRuleCriterion = { field: 'quality', operator: 'exists', value: null };
    expect(frontmatterRule.evaluateCriterion(existsCriterion, 5)).toBe(true);
    expect(frontmatterRule.evaluateCriterion(existsCriterion, undefined)).toBe(false);

    const notExistsCriterion: FrontmatterRuleCriterion = { field: 'quality', operator: 'not-exists', value: null };
    expect(frontmatterRule.evaluateCriterion(notExistsCriterion, undefined)).toBe(true);
    expect(frontmatterRule.evaluateCriterion(notExistsCriterion, 5)).toBe(false);
  });
});
