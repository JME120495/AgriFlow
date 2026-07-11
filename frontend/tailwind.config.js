/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cocoa: {
          50: '#fdf8f5',
          100: '#fbece5',
          200: '#f6d5c6',
          300: '#eeb29c',
          400: '#e3856b',
          500: '#d96348',
          600: '#c74c35',
          700: '#a53c2a',
          800: '#853225',
          900: '#6c2b21',
        },
      },
    },
  },
  plugins: [],
}
