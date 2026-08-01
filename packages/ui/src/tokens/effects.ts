export const shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  DEFAULT: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
} as const;

export const transitions = {
  none: 'none',
  all: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  DEFAULT: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  fast: '100ms cubic-bezier(0.4, 0, 0.2, 1)',
  normal: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  slower: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

export const transitionProperties = {
  common: ['background-color', 'border-color', 'color', 'fill', 'stroke', 'opacity', 'box-shadow', 'transform'],
  colors: ['background-color', 'border-color', 'color', 'fill', 'stroke'],
  opacity: ['opacity'],
  shadow: ['box-shadow'],
  transform: ['transform'],
} as const;

export const animations = {
  spin: 'spin 1s linear infinite',
  ping: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
  pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  bounce: 'bounce 1s infinite',
  fadeIn: 'fadeIn 150ms ease-out',
  fadeOut: 'fadeOut 100ms ease-in',
  slideIn: 'slideIn 200ms ease-out',
  slideOut: 'slideOut 150ms ease-in',
  scaleIn: 'scaleIn 150ms ease-out',
} as const;

export const keyframes = {
  spin: {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },
  ping: {
    '75%, 100%': { transform: 'scale(2)', opacity: '0' },
  },
  pulse: {
    '0%, 100%': { opacity: '1' },
    '50%': { opacity: '.5' },
  },
  bounce: {
    '0%, 100%': { transform: 'translateY(-25%)', animationTimingFunction: 'cubic-bezier(0.8,0,1,1)' },
    '50%': { transform: 'none', animationTimingFunction: 'cubic-bezier(0,0,0.2,1)' },
  },
  fadeIn: {
    from: { opacity: '0' },
    to: { opacity: '1' },
  },
  fadeOut: {
    from: { opacity: '1' },
    to: { opacity: '0' },
  },
  slideIn: {
    from: { transform: 'translateY(-4px)', opacity: '0' },
    to: { transform: 'translateY(0)', opacity: '1' },
  },
  slideOut: {
    from: { transform: 'translateY(0)', opacity: '1' },
    to: { transform: 'translateY(-4px)', opacity: '0' },
  },
  scaleIn: {
    from: { transform: 'scale(0.95)', opacity: '0' },
    to: { transform: 'scale(1)', opacity: '1' },
  },
} as const;

export const focusRing = {
  outline: '2px solid var(--mm-color-brand-500)',
  outlineOffset: '2px',
  boxShadow: '0 0 0 2px var(--mm-color-bg), 0 0 0 4px var(--mm-color-brand-500)',
} as const;
