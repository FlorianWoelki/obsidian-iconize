import { describe, expect, it } from 'vitest';
import {
  calculateFontTextSize,
  calculateHeaderSize,
  calculateInlineTitleSize,
  isHeader,
  isPx,
  pxToRem,
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

  it('should transform `px` to `em` values', () => {
    document.body.style.setProperty('--font-text-size', '16px');
    document.body.style.setProperty('--inline-title-size', '32px');
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

  it('should calculate the header size correctly based on header token', () => {
    document.body.style.setProperty('--font-text-size', '16px');
    document.body.style.setProperty('--h1-size', '2');
    expect(calculateHeaderSize('header-1')).toBe(32);
  });
});

describe('pxToRem', () => {
  it('should convert px to rem', () => {
    expect(pxToRem(16)).toBe(1);
    expect(pxToRem(24)).toBe(1.5);
    expect(pxToRem(32)).toBe(2);
  });

  it('should convert px to rem with different base value', () => {
    expect(pxToRem(16, 20)).toBe(0.8);
    expect(pxToRem(24, 20)).toBe(1.2);
    expect(pxToRem(32, 20)).toBe(1.6);
  });
});

describe('isPx', () => {
  it('should return `true` when value is in px format', () => {
    expect(isPx('16px')).toBe(true);
    expect(isPx('0px')).toBe(true);
    expect(isPx('5903px')).toBe(true);
  });

  it('should return `false` when value is in not px format', () => {
    expect(isPx('px')).toBe(false);
    expect(isPx('')).toBe(false);
    expect(isPx('16rem')).toBe(false);
    expect(isPx('16em')).toBe(false);
    expect(isPx('16ch')).toBe(false);
  });
});
