import { describe, expect, it } from 'vitest';
import svg from './svg';

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
