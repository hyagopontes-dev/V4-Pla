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
          DEFAULT: '#F5C518',
          light: '#FFD740',
          pale: '#FFF9E0',
        },
        black: { DEFAULT: '#0A0A0A', off: '#111111' },
        dark: { DEFAULT: '#1A1A1A', mid: '#2C2C2C' },
        border: '#2A2A2A',
      },
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
      },
      borderRadius: { DEFAULT: '2px', sm: '2px', md: '2px', lg: '4px' },
    },
  },
  plugins: [],
}
