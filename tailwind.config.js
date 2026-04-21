/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eaf3de',
          100: '#c0dd97',
          500: '#639922',
          700: '#3b6d11',
          900: '#27500a',
        }
      }
    },
  },
  plugins: [],
}
