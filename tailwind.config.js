/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['-apple-system', '"SF Pro Display"', '"SF Pro Text"', 'BlinkMacSystemFont', '"Helvetica Neue"', 'Inter', 'Arial', 'sans-serif'],
        sans: ['-apple-system', '"SF Pro Text"', 'BlinkMacSystemFont', '"Helvetica Neue"', 'Inter', 'Arial', 'sans-serif'],
      },
      colors: {
        canvas: 'rgb(var(--canvas) / <alpha-value>)',
        ink: 'rgb(var(--text-primary) / <alpha-value>)',
        subtle: 'rgb(var(--text-secondary) / <alpha-value>)',
        muted: 'rgb(var(--text-tertiary) / <alpha-value>)',
        surface: 'rgb(var(--surface-1) / <alpha-value>)',
        'surface-raised': 'rgb(var(--surface-raised) / <alpha-value>)',
        brand: 'rgb(var(--brand-lime) / <alpha-value>)',
        success: 'rgb(var(--status-success) / <alpha-value>)',
        danger: 'rgb(var(--status-skip) / <alpha-value>)',
        warning: 'rgb(var(--status-warning) / <alpha-value>)',
        info: 'rgb(var(--status-info) / <alpha-value>)',
        energy: 'rgb(var(--energy-amber) / <alpha-value>)',
      },
    },
  },
  plugins: [],
}
