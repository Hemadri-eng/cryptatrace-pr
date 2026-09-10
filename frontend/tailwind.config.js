/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#050b16",
          900: "#0a1628",
          800: "#0f2038",
          700: "#16304f",
          600: "#1f4368",
        },
        cyan: {
          400: "#4dd8e6",
          500: "#22b8cf",
          600: "#0e97ad",
        },
        risk: {
          low: "#2f9e5b",
          medium: "#c98a1f",
          high: "#d5651f",
          critical: "#c73438",
        },
        paper: "#f5f7fa",
      },
      fontFamily: {
        display: ["'IBM Plex Sans'", "system-ui", "sans-serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
    },
  },
  plugins: [],
}
