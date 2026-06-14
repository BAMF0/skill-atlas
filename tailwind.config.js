/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        warm: {
          50:  "var(--warm-50,  #FAFAF7)",
          100: "var(--warm-100, #F4F3EE)",
          200: "var(--warm-200, #E5E3DB)",
          300: "var(--warm-300, #D4D0C8)",
          400: "var(--warm-400, #B8B4AA)",
          500: "var(--warm-500, #A09F99)",
          600: "var(--warm-600, #6B6A64)",
          700: "var(--warm-700, #4A4944)",
          800: "var(--warm-800, #2D2D2B)",
          900: "var(--warm-900, #1C1C1A)",
          950: "var(--warm-950, #0F0F0E)",
        },
      },
      fontFamily: {
        serif: ["Georgia", '"Times New Roman"', "serif"],
        sans: ['system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
