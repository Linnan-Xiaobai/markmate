/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Theme-aware colors using CSS variables
        base: 'var(--color-base)',
        mantle: 'var(--color-mantle)',
        crust: 'var(--color-crust)',
        surface0: 'var(--color-surface0)',
        surface1: 'var(--color-surface1)',
        surface2: 'var(--color-surface2)',
        overlay0: 'var(--color-overlay0)',
        overlay1: 'var(--color-overlay1)',
        overlay2: 'var(--color-overlay2)',
        text: 'var(--color-text)',
        subtext0: 'var(--color-subtext0)',
        subtext1: 'var(--color-subtext1)',
        blue: 'var(--color-blue)',
        sapphire: 'var(--color-sapphire)',
        sky: 'var(--color-sky)',
        teal: 'var(--color-teal)',
        green: 'var(--color-green)',
        yellow: 'var(--color-yellow)',
        peach: 'var(--color-peach)',
        maroon: 'var(--color-maroon)',
        red: 'var(--color-red)',
        pink: 'var(--color-pink)',
        flamingo: 'var(--color-flamingo)',
        rosewater: 'var(--color-rosewater)',
        lavender: 'var(--color-lavender)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
