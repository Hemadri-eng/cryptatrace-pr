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
          50: "#eef3f8",
          200: "#c7d7e6",
          300: "#a3c1d9",
          400: "#5f92b8",
          500: "#2f6690",
          600: "#24506f",
          700: "#1c3f58",
          800: "#16324a",
          900: "#10253a",
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
        display: ["'Noto Sans'", "system-ui", "sans-serif"],
        sans: ["'Noto Sans'", "system-ui", "sans-serif"],
        mono: ["'Noto Sans Mono'", "monospace"],
      },
    },
  },
  plugins: [],
}
