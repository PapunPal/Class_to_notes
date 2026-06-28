/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#13005A',
          light: '#210080',
          dark: '#0d003f'
        },
        secondary: {
          DEFAULT: '#00337C',
          light: '#0047a8',
          dark: '#00204e'
        },
        accent: {
          DEFAULT: '#1C82AD',
          light: '#3ea2cc',
          dark: '#145d7c'
        },
        success: {
          DEFAULT: '#03C988',
          light: '#0bfba8',
          dark: '#028c5e'
        },
        darkBg: {
          DEFAULT: '#0B0033',
          card: '#15064c',
          border: '#25156b'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
      boxShadow: {
        premium: '0 8px 32px 0 rgba(19, 0, 90, 0.08)',
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
      }
    },
  },
  plugins: [],
}
