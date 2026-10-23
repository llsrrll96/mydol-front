/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        foreground: '#ededed',
        primary: {
          DEFAULT: '#ffffff',
          foreground: '#000000',
        },
        card: {
          DEFAULT: '#161616',
          foreground: '#ffffff',
        },
        tier: {
          s: '#FF7F7F',
          a: '#FFBF7F',
          b: '#FFFF7F',
          c: '#7FFF7F',
          d: '#7EFFFF',
          e: '#BF7FFF',
        },
      },
    },
  },
  plugins: [],
}
