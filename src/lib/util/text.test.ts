import { describe, expect, it } from 'vitest';
import {
  calculateFontTextSize,
  calculateHeaderSize,
  calculateInlineTitleSize,
  isHeader,
} from './text';

describe('calculateFontTextSize', () => {
  it('should return the font text size from document body', () => {
    document.body.style.setProperty('--font-text-size', '16px');
    expect(calculateFontTextSize()).toBe(16);
  });

  it('should return the font text size from document element if not found in body', () => {
    document.body.style.removeProperty('--font-text-size');
    document.documentElement.style.fontSize = '16px';
    expect(calculateFontTextSize()).toBe(16);
  });
});

describe('calculateInlineTitleSize', () => {
  it('should calculate the inline title size correctly', () => {
    document.body.style.setProperty('--font-text-size', '16px');
    document.body.style.setProperty('--inline-title-size', '2');
    expect(calculateInlineTitleSize()).toBe(32);
  });
});

describe('isHeader', () => {
  it.each(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])(
    'should return `true` for %s',
    (value) => {
      expect(isHeader(value)).toBe(true);
    },
  );

  it('should return `false` for invalid header values', () => {
    expect(isHeader('h7')).toBe(false);
    expect(isHeader('h0')).toBe(false);
    expect(isHeader('h')).toBe(false);
    expect(isHeader('')).toBe(false);
  });
});

describe('calculateHeaderSize', () => {
  it('should calculate the header size correctly', () => {
    document.body.style.setProperty('--font-text-size', '16px');
    document.body.style.setProperty('--h1-size', '2');
    expect(calculateHeaderSize('h1')).toBe(32);
  });
});
