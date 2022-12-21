const viewboxRegex = /viewBox="([^"]*)"/g;
const contentRegex = /<svg.*>(.*?)<\/svg>/g;
const pathRegex = /<path\s([^>]*)>/g;
const attrRegex = /(?:\s*|^)([^= ]*)="([^"]*)"/g;
const rootElementRegex = /<svg [^>]+[\w]="(.*?)"+>/g;
const fillAttrRegex = /fill="([^"]*)"/g;
const widthRegex = /width="(([^"]*))"/g;
const heightRegex = /height="([^"]*)"/g;

export const extract = (svgString: string): string => {
  svgString = svgString.replace(/(\r\n|\n|\r)/gm, '');
  svgString = svgString.replace(/>\s+</gm, '><');

  let svgPaths;
  try {
    svgPaths = extractPaths(svgString);
  } catch (error) {
    console.log(error);
    return '';
  }

  const svgViewboxMatch = svgString.match(viewboxRegex);
  let svgViewbox: string = '';
  if (svgViewboxMatch && svgViewboxMatch.length !== 0) {
    svgViewbox = svgViewboxMatch[0];
  }

  const svgContentMatch = svgString.match(contentRegex);
  const svgContent = svgContentMatch.map((val) => val.replace(/<\/?svg>/g, '').replace(/<svg.+?>/g, ''))[0];

  const widthMatches = widthRegex.exec(svgString);
  const heightMatches = heightRegex.exec(svgString);
  let width = '16';
  if (widthMatches?.length >= 1) {
    width = widthMatches[1];
  }
  let height = '16';
  if (heightMatches?.length >= 1) {
    height = heightMatches[1];
  }
  const viewbox = svgViewbox.length === 0 ? `viewbox="0 0 ${width} ${height}"` : svgViewbox;

  let fill = 'fill="currentColor"';
  let otherAttrs = '';

  const rootElement = svgString.match(rootElementRegex);
  if (rootElement?.length > 0) {
    const fillMatch = rootElement[0].match(fillAttrRegex);
    if (fillMatch?.length > 0) {
      fill = fillMatch[0];
    }

    const svgContent = rootElement[0]
      .replace(/<\/?svg>/g, '')
      .replace(/<svg/g, '')
      .replace(/>/g, '');
    otherAttrs += svgContent
      .replace(fill, '')
      .replace(viewbox, '')
      .replace(/\s(width|height)="\d+"/g, '');
  }

  const svgElement = `<svg
  width="16"
  height="16"
  ${viewbox}
  ${fill}
  ${otherAttrs}
>
  ${svgContent}
</svg>`;

  return svgElement;
};

const extractPaths = (content: string) => {
  const allPaths = [];
  while (true) {
    const svgPathMatches = pathRegex.exec(content);
    const svgPath = svgPathMatches && svgPathMatches[1];
    if (!svgPath) {
      const svgContentMatch = content.match(contentRegex);
      const svgContent = svgContentMatch.map((val) => val.replace(/<\/?svg>/g, '').replace(/<svg.+?>/g, ''))[0];
      allPaths.push(svgContent);
      break;
    }

    const attrs: any = {};
    while (true) {
      const svgAttrMatches = attrRegex.exec(svgPath);
      if (!svgAttrMatches) {
        break;
      }
      attrs[svgAttrMatches[1]] = svgAttrMatches[2];
    }
    if (attrs.fill === 'none') {
      continue;
    }
    allPaths.push(attrs.d ?? attrs);
  }

  return allPaths;
};
