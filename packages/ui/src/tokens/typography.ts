export const fontFamilies = {
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
  serif: 'Georgia, Cambria, "Times New Roman", Times, serif',
  mono: '"JetBrains Mono", "Fira Code", "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  heading: 'inherit',
} as const;

export const fontSizes = {
  xs: '0.75rem',
  sm: '0.875rem',
  base: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
  '4xl': '2.25rem',
  '5xl': '3rem',
  '6xl': '3.75rem',
} as const;

export const lineHeights = {
  none: '1',
  tight: '1.25',
  snug: '1.375',
  normal: '1.5',
  relaxed: '1.625',
  loose: '2',
} as const;

export const letterSpacings = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0em',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
} as const;

export const fontWeights = {
  thin: '100',
  extralight: '200',
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
} as const;

export const markdownTypography = {
  h1: {
    fontSize: '2em',
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.tight,
    marginTop: '0',
    marginBottom: '0.5em',
  },
  h2: {
    fontSize: '1.5em',
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.tight,
    marginTop: '1.5em',
    marginBottom: '0.5em',
  },
  h3: {
    fontSize: '1.25em',
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.tight,
    marginTop: '1.25em',
    marginBottom: '0.5em',
  },
  h4: {
    fontSize: '1em',
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.tight,
    marginTop: '1em',
    marginBottom: '0.5em',
  },
  h5: {
    fontSize: '0.875em',
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.tight,
    marginTop: '1em',
    marginBottom: '0.5em',
  },
  h6: {
    fontSize: '0.85em',
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.tight,
    marginTop: '1em',
    marginBottom: '0.5em',
    color: 'var(--mm-color-text-muted)',
  },
  p: {
    fontSize: fontSizes.base,
    lineHeight: lineHeights.relaxed,
    marginBottom: '1em',
  },
  code: {
    fontSize: '0.875em',
    fontFamily: fontFamilies.mono,
    padding: '0.2em 0.4em',
    borderRadius: '0.25rem',
  },
  pre: {
    fontSize: '0.875em',
    fontFamily: fontFamilies.mono,
    lineHeight: lineHeights.normal,
    padding: '1em',
    borderRadius: '0.5rem',
    marginBottom: '1em',
    overflow: 'auto',
  },
} as const;
