/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mh: {
          header: '#FAF5E8',
          cream: '#FDFBF5',
          jaali: '#F9F1DF',
          gold: '#C69722',
          goldLight: '#F7C600',
          goldOlive: '#7C6A24',
          dark: '#161616',
          charcoal: '#1F1F1F',
          border: '#E6D6B8'
        }
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', '"Noto Serif Devanagari"', 'Georgia', 'serif'],
        devanagari: ['"Noto Serif Devanagari"', 'serif'],
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
