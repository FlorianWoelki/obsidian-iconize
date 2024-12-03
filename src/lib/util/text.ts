// Cache for font size
let cachedFontSize: number | null = null;
let fontSizeCacheTime: number = 0;

const calculateFontTextSize = () => {
  // get cached font size if available
  const now = Date.now();
  if (cachedFontSize !== null && now - fontSizeCacheTime < 2000) {
    return cachedFontSize;
  }

  let fontSize = parseFloat(
    getComputedStyle(document.body).getPropertyValue('--font-text-size') ?? '0',
  );
  if (!fontSize) {
    fontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
  }
  // set font size cache
  cachedFontSize = fontSize;
  fontSizeCacheTime = now;
  return fontSize;
};

const calculateInlineTitleSize = (): number => {
  const fontSize = calculateFontTextSize();
  const inlineTitleSizeValue = getComputedStyle(document.body).getPropertyValue(
    '--inline-title-size',
  );
  const unit = inlineTitleSizeValue.replace(/[\d.]/g, '');
  let inlineTitleSize = parseFloat(inlineTitleSizeValue);
  if (unit === 'px') {
    inlineTitleSize /= 16;
  }

  return fontSize * inlineTitleSize;
};

// Type is being used for the HTML header tags.
export type HTMLHeader = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
// Type is being used for the header token types in codemirror.
export type HeaderToken =
  | 'header-1'
  | 'header-2'
  | 'header-3'
  | 'header-4'
  | 'header-5'
  | 'header-6';

const isHeader = (value: string): boolean => {
  return /^h[1-6]$/.test(value);
};

const getHTMLHeaderByToken = (header: HeaderToken): HTMLHeader | null => {
  for (let i = 1; i <= 6; i++) {
    if (header === `header-${i}`) {
      return `h${i}` as HTMLHeader;
    }
  }
  return null;
};

const calculateHeaderSize = (header: HTMLHeader | HeaderToken): number => {
  const fontSize = calculateFontTextSize();
  const htmlHeader = getHTMLHeaderByToken(header as HeaderToken) ?? header;
  const headerComputedStyle = getComputedStyle(document.body).getPropertyValue(
    `--${htmlHeader}-size`,
  );
  let headerSize = parseFloat(headerComputedStyle);
  if (isPx(headerComputedStyle)) {
    headerSize = pxToRem(headerSize, fontSize);
  }

  // If there is some `calc` operation going on, it has to be evaluated.
  if (headerComputedStyle.includes('calc')) {
    const temp = document.createElement('div');

    temp.style.setProperty('font-size', `var(--${htmlHeader}-size)`);
    document.body.appendChild(temp);

    const computedStyle = window.getComputedStyle(temp);
    const computedValue = computedStyle.getPropertyValue('font-size');
    headerSize = parseFloat(computedValue);
    if (isPx(computedValue)) {
      headerSize = pxToRem(headerSize, fontSize);
    }

    document.body.removeChild(temp);
  }

  return fontSize * headerSize;
};

const pxToRem = (px: number, baseSize = 16): number => {
  return px / baseSize;
};

const isPx = (value: string): boolean => {
  return /^-?\d+(\.\d+)?px$/.test(value);
};

export {
  calculateInlineTitleSize,
  calculateHeaderSize,
  calculateFontTextSize,
  isHeader,
  isPx,
  pxToRem,
};
