/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#07070f',
        surface:  'rgba(255,255,255,0.042)',
        surface2: 'rgba(255,255,255,0.07)',
        surface3: 'rgba(255,255,255,0.11)',
        border:   'rgba(255,255,255,0.09)',
        muted:    'rgba(255,255,255,0.18)',
        subtle:   'rgba(255,255,255,0.45)',
        txt:      '#e8e8f4',
        accent:   '#6366f1',
        'accent-dim': '#4f46e5',
        success:  '#22c55e',
        warning:  '#f59e0b',
        streak:   '#f97316',
        danger:   '#ef4444',
        exp:      '#818cf8',
      },
      boxShadow: {
        glass:   '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
        glow:    '0 0 40px rgba(99,102,241,0.25)',
        'glow-streak': '0 0 50px rgba(249,115,22,0.2)',
        'glow-success': '0 0 30px rgba(34,197,94,0.2)',
      },
      borderRadius: {
        '2xl': '18px',
        '3xl': '24px',
        '4xl': '32px',
      },
    },
  },
  plugins: [],
}
