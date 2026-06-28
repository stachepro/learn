/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'Inter', 'sans-serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        // Sea-glass palette
        ground: '#3c4f61',
        ink: '#21303d',
        'ink-soft': '#465a68',
        txt: '#21303d',
        subtle: '#5b6c7a',
        muted: '#869aa7',
        surface3: '#c4d2d2',
        accent: '#2f7d70',
        teal: '#5e9088',
        amber: '#d7842a',
        sky: '#4179ad',
        lime: '#7e9a3c',
        rust: '#a83a16',
        success: '#3f9a55',
        danger: '#c0432e',
      },
    },
  },
  plugins: [],
}
