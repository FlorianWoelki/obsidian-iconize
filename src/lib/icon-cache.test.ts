import { IconCache } from './icon-cache';
import { describe, expect, it } from 'vitest';

describe('set', () => {
  it('should add a record', () => {
    const path = 'path';
    const record = { iconNameWithPrefix: 'IbTest' };

    IconCache.getInstance().set(path, record);
    const result = IconCache.getInstance().get(path);
    expect(result).toEqual(record);
  });
});

describe('get', () => {
  it('should return `null` for a non-existent record', () => {
    const path = 'non-existent-path';
    const result = IconCache.getInstance().get(path);
    expect(result).toBeNull();
  });

  it('should return a record that was added', () => {
    const path = 'path';
    const record = { iconNameWithPrefix: 'IbTest' };

    IconCache.getInstance().set(path, record);
    const result = IconCache.getInstance().get(path);
    expect(result).toEqual(record);
  });
});

describe('doesRecordExist', () => {
  it('should return `false` for a non-existent record', () => {
    const path = 'non-existent-path';
    const result = IconCache.getInstance().doesRecordExist(path);
    expect(result).toBe(false);
  });

  it('should return `true` for a record that was added', () => {
    const path = 'path';
    const record = { iconNameWithPrefix: 'IbTest' };

    IconCache.getInstance().set(path, record);
    const result = IconCache.getInstance().doesRecordExist(path);
    expect(result).toBe(true);
  });
});

describe('invalidate', () => {
  it('should invalidate a record', () => {
    const path = 'path';
    const record = { iconNameWithPrefix: 'IbTest' };

    IconCache.getInstance().set(path, record);
    IconCache.getInstance().invalidate(path);
    const result = IconCache.getInstance().get(path);
    expect(result).toBeNull();
  });
});

describe('clear', () => {
  it('should clear all records', () => {
    const path = 'path';
    const record = { iconNameWithPrefix: 'IbTest' };

    IconCache.getInstance().set(path, record);
    IconCache.getInstance().clear();
    const result = IconCache.getInstance().get(path);
    expect(result).toBeNull();
  });
});
