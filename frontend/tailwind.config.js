/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: 'var(--paper, #f8f7f3)',
        surface: 'var(--surface, #fffefa)',
        ink: {
          DEFAULT: 'var(--ink, #202a39)',
          soft: 'var(--ink-soft, #667182)',
        },
        maroon: {
          DEFAULT: 'var(--maroon, #7f1d3b)',
          dark: 'var(--maroon-dark, #5c132b)',
        },
        rose: 'var(--rose, #f4e4e4)',
        'blue-wash': 'var(--blue-wash, #e8eef0)',
        'sand-wash': 'var(--sand-wash, #f2eadc)',
        brand: {
          600: 'var(--maroon, #7f1d3b)', // Alias for legacy usage
          700: 'var(--maroon-dark, #5c132b)',
        },
        cream: {
          100: 'var(--paper, #f8f7f3)', // Alias for legacy usage
        }
      },
      fontFamily: {
        display: ['"Sora"', 'sans-serif'],
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: 'var(--shadow-soft, 0 18px 42px rgba(59, 43, 38, 0.07))',
        lift: 'var(--shadow-lift, 0 22px 54px rgba(59, 43, 38, 0.12))',
      },
      borderRadius: {
        '4xl': '2rem',
        card: '18px',
      },
    },
  },
  plugins: [],
}
