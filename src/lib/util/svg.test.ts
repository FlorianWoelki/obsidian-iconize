import { vi, describe, expect, it, afterEach } from 'vitest';
import svg from './svg';

describe('extract', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should remove unnecessary spaces and newlines', () => {
    const input =
      '<svg viewBox="0 0 100 100">\n<circle cx="50" cy="50" r="10" />\n</svg>';
    const output = svg.extract(input);
    expect(output).toBe(
      '<svg viewBox="0 0 100 100" fill="currentColor" width="16px" height="16px"><circle cx="50" cy="50" r="10"></circle></svg>',
    );
  });

  it('should remove `width` and `height` from style attribute', () => {
    const input =
      '<svg viewBox="0 0 100 100" style="width:100px; height:100px;"><circle cx="50" cy="50" r="10" /></svg>';
    const output = svg.extract(input);
    expect(output).not.toMatch(/style=""/);
  });

  it('should set `viewbox` width and height if they are `0` to the SVG width and height', () => {
    const mockSVG = {
      querySelector: vi.fn(),
      hasAttribute: vi.fn(() => true),
      setAttribute: vi.fn(),
      style: { width: '', height: '' },
      viewBox: { baseVal: { width: 0, height: 0 } },
      width: { baseVal: { value: 12 } },
      height: { baseVal: { value: 12 } },
    };

    const mockParseFromString = vi.fn().mockReturnValue({
      querySelector: vi.fn(() => mockSVG),
    });

    vi.spyOn(global, 'DOMParser').mockImplementation(function (this: any) {
      this.parseFromString = mockParseFromString;
      return this;
    } as any);

    const input =
      '<svg viewBox="0 0 0 0"><circle cx="50" cy="50" r="10" /></svg>';
    svg.extract(input);

    expect(mockSVG.viewBox.baseVal.width).toBe(12);
    expect(mockSVG.viewBox.baseVal.height).toBe(12);
  });

  it('should set `viewbox` width and height if they are `0` to the SVG width and height', () => {
    const mockSVG = {
      querySelector: vi.fn(),
      hasAttribute: vi.fn(() => true),
      setAttribute: vi.fn(),
      style: { width: '', height: '' },
      viewBox: { baseVal: { width: 0, height: 0 } },
      width: { baseVal: { value: null as any } },
      height: { baseVal: { value: null as any } },
    };

    const mockParseFromString = vi.fn().mockReturnValue({
      querySelector: vi.fn(() => mockSVG),
    });

    vi.spyOn(global, 'DOMParser').mockImplementation(function (this: any) {
      this.parseFromString = mockParseFromString;
      return this;
    } as any);

    const input =
      '<svg viewBox="0 0 0 0"><circle cx="50" cy="50" r="10" /></svg>';
    svg.extract(input);

    expect(mockSVG.viewBox.baseVal.width).toBe(16);
    expect(mockSVG.viewBox.baseVal.height).toBe(16);
  });

  it('should set `fill` attribute to `currentColor` if not present', () => {
    const input =
      '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="10" /></svg>';
    const output = svg.extract(input);
    expect(output).toMatch(/fill="currentColor"/);
  });
});

describe('setFontSize', () => {
  it('should set width and height according to the defined integer font size', () => {
    const input = `<svg width="100" height="100"><circle cx="50" cy="50" r="10" /></svg>`;
    const output = svg.setFontSize(input, 50);
    expect(output).toMatch(/width="50px"/);
    expect(output).toMatch(/height="50px"/);
  });

  it('should set width and height according to the defined floating point number font size', () => {
    const input = `<svg width="32.5" height="32.55"><circle cx="50" cy="50" r="10" /></svg>`;
    const output = svg.setFontSize(input, 95.5);
    expect(output).toMatch(/width="95.5px"/);
    expect(output).toMatch(/height="95.5px"/);
  });
});

describe('colorize', () => {
  it('should set fill color if fill attribute is present and not `null`', () => {
    const input = `<svg fill="red"><circle cx="50" cy="50" r="10" /></svg>`;
    const output = svg.colorize(input, 'blue');
    expect(output).toMatch(/fill="blue"/);
  });

  it('should set stroke color if stroke attribute is present and not `null`', () => {
    const input = `<svg stroke="red"><circle cx="50" cy="50" r="10" /></svg>`;
    const output = svg.colorize(input, 'blue');
    expect(output).toMatch(/stroke="blue"/);
  });

  it('should default to `currentColor` if color is `null`', () => {
    const input = `<svg fill="red"><circle cx="50" cy="50" r="10" /></svg>`;
    const output = svg.colorize(input, null);
    expect(output).toMatch(/fill="currentColor"/);
  });
});
