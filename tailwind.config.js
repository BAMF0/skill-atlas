/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        warm: {
          50:  "#FAFAF7",
          100: "#F4F3EE",
          200: "#E5E3DB",
          300: "#D4D0C8",
          400: "#B8B4AA",
          500: "#A09F99",
          600: "#6B6A64",
          700: "#4A4944",
          800: "#2D2D2B",
          900: "#1C1C1A",
          950: "#0F0F0E",
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
