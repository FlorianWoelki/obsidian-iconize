/**
 * Extracts an SVG string from a given input string and returns a cleaned up and
 * formatted SVG string.
 * @param svgString SVG string to extract from.
 * @returns Cleaned up and formatted SVG string.
 */
const extract = (svgString: string): string => {
  // Removes unnecessary spaces and newlines.
  svgString = svgString.replace(/(\r\n|\n|\r)/gm, '');
  svgString = svgString.replace(/>\s+</gm, '><');

  // Create a parser for better parsing of HTML.
  const parser = new DOMParser();
  const svg = parser.parseFromString(svgString, 'text/html').querySelector('svg');

  // Removes `width` and `height` from the `style` attribute.
  if (svg.hasAttribute('style')) {
    svg.style.width = '';
    svg.style.height = '';
  }

  // Add `viewbox`, if it is not already a attribute.
  if (svg.viewBox.baseVal.width === 0 && svg.viewBox.baseVal.height === 0) {
    const width = svg.width.baseVal.value ?? 16;
    const height = svg.height.baseVal.value ?? 16;
    svg.viewBox.baseVal.width = width;
    svg.viewBox.baseVal.height = height;
  }

  if (!svg.hasAttribute('fill')) {
    svg.setAttribute('fill', 'currentColor');
  }

  svg.setAttribute('width', '16px');
  svg.setAttribute('height', '16px');

  return svg.outerHTML;
};

/**
 * Sets the font size of an SVG string by modifying its width and/or height attributes.
 * The font size will be always set in pixels.
 * @param svgString SVG string to modify.
 * @param fontSize Font size in pixels to set.
 * @returns Modified SVG string.
 */
const setFontSize = (svgString: string, fontSize: number): string => {
  const widthRe = new RegExp(/width="\d+(px)?"/);
  const heightRe = new RegExp(/height="\d+(px)?"/);
  if (svgString.match(widthRe)) {
    svgString = svgString.replace(widthRe, `width="${fontSize}px"`);
  }
  if (svgString.match(heightRe)) {
    svgString = svgString.replace(heightRe, `height="${fontSize}px"`);
  }
  return svgString;
};

/**
 * Replaces the fill or stroke color of an SVG string with a given color.
 * @param svgString SVG string to modify.
 * @param color Color to set. Defaults to 'currentColor'.
 * @returns The modified SVG string.
 */
const colorize = (svgString: string, color: string | undefined | null): string => {
  if (!color) {
    color = 'currentColor';
  }

  const parser = new DOMParser();
  // Tries to parse the string into a HTML node.
  const parsedNode = parser.parseFromString(svgString, 'text/html');
  const svg = parsedNode.querySelector('svg');

  if (svg) {
    if (svg.hasAttribute('fill') && svg.getAttribute('fill') !== 'none') {
      svg.setAttribute('fill', color);
    } else if (svg.hasAttribute('stroke') && svg.getAttribute('stroke') !== 'none') {
      svg.setAttribute('stroke', color);
    }

    return svg.outerHTML;
  }

  return svgString;
};

export default {
  extract,
  colorize,
  setFontSize,
};
