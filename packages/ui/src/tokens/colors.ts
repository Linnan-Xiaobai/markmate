export const colors = {
  transparent: 'transparent',
  current: 'currentColor',

  white: '#FFFFFF',
  black: '#000000',

  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
    950: '#030712',
  },

  brand: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
    950: '#172554',
  },

  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
    950: '#052E16',
  },

  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
    950: '#451A03',
  },

  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
    950: '#450A0A',
  },

  info: {
    50: '#F0F9FF',
    100: '#E0F2FE',
    200: '#BAE6FD',
    300: '#7DD3FC',
    400: '#38BDF8',
    500: '#0EA5E9',
    600: '#0284C7',
    700: '#0369A1',
    800: '#075985',
    900: '#0C4A6E',
    950: '#082F49',
  },

  markdown: {
    heading: 'var(--mm-markdown-heading)',
    text: 'var(--mm-markdown-text)',
    link: 'var(--mm-markdown-link)',
    codeBg: 'var(--mm-markdown-code-bg)',
    codeText: 'var(--mm-markdown-code-text)',
    blockquoteBorder: 'var(--mm-markdown-quote-border)',
    blockquoteBg: 'var(--mm-markdown-quote-bg)',
    tableBorder: 'var(--mm-markdown-table-border)',
    tableHeaderBg: 'var(--mm-markdown-table-header)',
    hr: 'var(--mm-markdown-hr)',
  },

  editor: {
    bg: 'var(--mm-editor-bg)',
    text: 'var(--mm-editor-text)',
    gutterBg: 'var(--mm-editor-gutter-bg)',
    gutterText: 'var(--mm-editor-gutter-text)',
    selection: 'var(--mm-editor-selection)',
    cursor: 'var(--mm-editor-cursor)',
    currentLine: 'var(--mm-editor-current-line)',
  },

  sidebar: {
    bg: 'var(--mm-sidebar-bg)',
    hover: 'var(--mm-sidebar-hover)',
    active: 'var(--mm-sidebar-active)',
    border: 'var(--mm-sidebar-border)',
    text: 'var(--mm-sidebar-text)',
    textMuted: 'var(--mm-sidebar-text-muted)',
  },

  toolbar: {
    bg: 'var(--mm-toolbar-bg)',
    hover: 'var(--mm-toolbar-hover)',
    active: 'var(--mm-toolbar-active)',
    border: 'var(--mm-toolbar-border)',
    text: 'var(--mm-toolbar-text)',
  },
} as const;

export type ColorScale = keyof typeof colors.gray;
export type SemanticColor = 'brand' | 'success' | 'warning' | 'error' | 'info';
