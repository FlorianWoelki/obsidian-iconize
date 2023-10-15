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

  const mockParseFromString = (width: number | null, height: number | null) => {
    return {
      parseFromString: vi.fn(
        () =>
          ({
            querySelector: vi.fn(() => ({
              hasAttribute: vi.fn(() => true),
              setAttribute: vi.fn(),
              style: { width: '', height: '' },
              viewBox: { baseVal: { width: 0, height: 0 } },
              width: { baseVal: { value: width } },
              height: { baseVal: { value: height } },
            })),
          }) as any,
      ),
    };
  };

  it('should set `viewbox` width and height if they are `0` to the SVG width and height', () => {
    const s = vi
      .spyOn(window, 'DOMParser')
      .mockImplementationOnce(() => mockParseFromString(12, 12));

    const input =
      '<svg viewBox="0 0 0 0"><circle cx="50" cy="50" r="10" /></svg>';
    svg.extract(input);

    // TODO: Maybe find better alternative to this.
    const extractedSVG =
      s.mock.results[0].value.parseFromString.mock.results[0].value
        .querySelector.mock.results[0].value;
    expect(extractedSVG.viewBox.baseVal.width).toBe(12);
    expect(extractedSVG.viewBox.baseVal.height).toBe(12);
  });

  it('should set `viewbox` width and height if they are `0` to the SVG width and height', () => {
    const s = vi
      .spyOn(window, 'DOMParser')
      .mockImplementationOnce(() => mockParseFromString(null, null));

    const input =
      '<svg viewBox="0 0 0 0"><circle cx="50" cy="50" r="10" /></svg>';
    svg.extract(input);

    // TODO: Maybe find better alternative to this.
    const extractedSVG =
      s.mock.results[0].value.parseFromString.mock.results[0].value
        .querySelector.mock.results[0].value;
    expect(extractedSVG.viewBox.baseVal.width).toBe(16);
    expect(extractedSVG.viewBox.baseVal.height).toBe(16);
  });

  it('should set `fill` attribute to `currentColor` if not present', () => {
    const input =
      '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="10" /></svg>';
    const output = svg.extract(input);
    expect(output).toMatch(/fill="currentColor"/);
  });
});

describe('setFontSize', () => {
  it('should set width and height according to the defined font size', () => {
    const input = `<svg width="100" height="100"><circle cx="50" cy="50" r="10" /></svg>`;
    const output = svg.setFontSize(input, 50);
    expect(output).toMatch(/width="50px"/);
    expect(output).toMatch(/height="50px"/);
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
