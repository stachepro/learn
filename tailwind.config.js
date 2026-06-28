/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a12',
        surface: '#13131e',
        surface2: '#1c1c2e',
        surface3: '#242438',
        border: '#2a2a42',
        muted: '#3a3a5c',
        subtle: '#7070a0',
        txt: '#e0e0f0',
        accent: '#8b5cf6',
        'accent-dim': '#6d28d9',
        'accent-glow': '#8b5cf620',
        streak: '#f97316',
        'streak-dim': '#c2410c',
        'streak-glow': '#f9731620',
        success: '#22c55e',
        'success-dim': '#15803d',
        'success-glow': '#22c55e18',
        warning: '#f59e0b',
        danger: '#ef4444',
        exp: '#818cf8',
      },
      boxShadow: {
        'streak': '0 0 24px #f9731628',
        'accent': '0 0 24px #8b5cf628',
        'success': '0 0 16px #22c55e20',
      },
    },
  },
  plugins: [],
}
