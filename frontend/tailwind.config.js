/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Warm maroon / terracotta system, in the spirit of the campus-portal
        // reference: cream-white surfaces, deep crimson primary, burnt-orange accent.
        brand: {
          50: '#fff3ec',
          100: '#fee6d8',
          200: '#fdd0b3',
          300: '#f7ac7d',
          400: '#e97a45',
          500: '#d85a28',
          600: 'var(--color-primary)',
          700: '#800023',
          800: '#5c001a',
          900: '#3d0012',
        },
        cream: {
          DEFAULT: 'var(--color-background)',
          50: '#fbfaf8',
          100: 'var(--color-background)',
          200: '#f0eee9',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(20, 15, 10, 0.04), 0 8px 24px -8px rgba(80, 30, 20, 0.10)',
        card: '0 1px 3px rgba(20, 15, 10, 0.05), 0 16px 40px -20px rgba(80, 30, 20, 0.18)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
