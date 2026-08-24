/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        luxury: {
          cream: 'rgb(var(--luxury-canvas) / <alpha-value>)',
          beige: 'rgb(var(--luxury-surface) / <alpha-value>)',
          sand: 'rgb(var(--luxury-border) / <alpha-value>)',
          gold: 'rgb(var(--luxury-gold) / <alpha-value>)',
          darkGold: 'rgb(var(--luxury-gold-strong) / <alpha-value>)',
          brown: 'rgb(var(--luxury-muted) / <alpha-value>)',
          charcoal: 'rgb(var(--luxury-ink) / <alpha-value>)',
          terracotta: 'rgb(var(--luxury-terracotta) / <alpha-value>)',
          night: '#25211D',
          ivory: '#F2ECE2',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
      },
    },
  },
  plugins: [],
}
