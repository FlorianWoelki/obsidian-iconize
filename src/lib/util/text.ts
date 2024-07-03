const calculateFontTextSize = (): number => {
  let fontSize = parseFloat(
    getComputedStyle(document.body).getPropertyValue('--font-text-size') ?? '0',
  );
  if (!fontSize) {
    fontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
  }
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
  const headerSize = parseFloat(
    getComputedStyle(document.body).getPropertyValue(`--${htmlHeader}-size`),
  );
  return fontSize * headerSize;
};

export {
  calculateInlineTitleSize,
  calculateHeaderSize,
  calculateFontTextSize,
  isHeader,
};
