/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fef2ee', 100: '#fde0d7', 200: '#fbbfae', 300: '#f79a82',
          400: '#f37656', 500: '#ee5034', 600: '#d63d22', 700: '#b0301a',
          800: '#862515', 900: '#5a190e',
        },
        flame: {
          50: '#fdeeea', 100: '#fad6cc', 200: '#f2a899', 300: '#e6776a',
          400: '#d4503f', 500: '#b83222', 600: '#9a281a', 700: '#7a1f14',
          800: '#5a170f', 900: '#3b0f09',
        },
        mint: { 400: '#3ee0a8', 500: '#14c48a', 600: '#0b9e6f' },
        sun: { 50: '#fff8dc', 100: '#ffefa8', 300: '#ffd84d', 500: '#ffc107', 700: '#a87a00' },
        teal: { 50: '#e3faf6', 100: '#b8f0e6', 500: '#14b8a6', 600: '#0f9d8e', 700: '#0b7d72', 900: '#06433d' },
        pink: { 50: '#fff0f3', 100: '#ffd6df', 500: '#ff6b8b', 700: '#c2375a' },
        sky: { 50: '#e8f5ff', 100: '#c7e6ff', 500: '#3da5f5', 700: '#1d6fb8' },
        cream: '#fff6e8',
        ink: { 900: '#1c1a3a', 700: '#3f3d5c', 500: '#6f6d8c', 300: '#bdbbd3', 100: '#e9e8f3' },
      },
      fontFamily: { display: ['Fraunces', 'Georgia', 'serif'], brand: ['Chewy', 'cursive'], sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'] },
      boxShadow: { card: '0 1px 2px rgba(28,26,58,.06), 0 6px 20px rgba(28,26,58,.08)' },
    },
  },
  plugins: [],
}
