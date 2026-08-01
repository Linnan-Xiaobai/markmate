export { colors } from './colors';
export type { ColorScale, SemanticColor } from './colors';

export {
  fontFamilies,
  fontSizes,
  lineHeights,
  letterSpacings,
  fontWeights,
  markdownTypography,
} from './typography';

export { spacing, sizes, borderRadius, borderWidths, zIndices } from './spacing';

export {
  shadows,
  transitions,
  transitionProperties,
  animations,
  keyframes,
  focusRing,
} from './effects';

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export type Breakpoint = keyof typeof breakpoints;
