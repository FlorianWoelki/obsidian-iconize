export const extract = (svgString: string): string => {
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
