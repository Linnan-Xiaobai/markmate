import type { Config } from 'tailwindcss';
import { colors, spacing, borderRadius, fontFamilies, fontSizes, shadows } from './src/tokens';

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/**/src/**/*.{ts,tsx}',
    '../../apps/**/src/**/*.{ts,tsx}',
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        gray: colors.gray,
        brand: colors.brand,
        success: colors.success,
        warning: colors.warning,
        error: colors.error,
        info: colors.info,
      },
      fontFamily: fontFamilies,
      fontSize: fontSizes,
      spacing: Object.fromEntries(
        Object.entries(spacing).filter(([key]) => !isNaN(Number(key)) || key === 'px')
      ),
      borderRadius: {
        ...borderRadius,
      },
      boxShadow: shadows,
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        DEFAULT: '150ms',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-from-right': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'zoom-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'slide-in-from-right-full': 'slide-in-from-right 200ms ease-out',
        'zoom-in-95': 'zoom-in 150ms ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
