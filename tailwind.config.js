/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf8f3',
          100: '#f9ebd9',
          200: '#f2d4ae',
          300: '#e9b67a',
          400: '#de9348',
          500: '#d17a2a',
          600: '#b85f21',
          700: '#94481f',
          800: '#763b20',
          900: '#60311d',
        },
        jamu: {
          DEFAULT: '#8B4513',
          light: '#C97B3C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
    },
  },
  plugins: [],
};
