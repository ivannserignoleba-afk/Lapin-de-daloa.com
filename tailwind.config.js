/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf4ec',
          100: '#fbe6d3',
          200: '#f5c69f',
          300: '#eea068',
          400: '#e57d3b',
          500: '#d9611f',
          600: '#b84a17',
          700: '#933a17',
          800: '#762f18',
          900: '#602817',
        },
      },
    },
  },
  plugins: [],
};
