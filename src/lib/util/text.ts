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
  const inlineTitleSize = parseFloat(
    getComputedStyle(document.body).getPropertyValue('--inline-title-size'),
  );
  return fontSize * inlineTitleSize;
};

export type Header = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

const isHeader = (value: string): boolean => {
  return /^h[1-6]$/.test(value);
};

const calculateHeaderSize = (header: Header): number => {
  const fontSize = calculateFontTextSize();
  const headerSize = parseFloat(
    getComputedStyle(document.body).getPropertyValue(`--${header}-size`),
  );
  return fontSize * headerSize;
};

export {
  calculateInlineTitleSize,
  calculateHeaderSize,
  calculateFontTextSize,
  isHeader,
};
