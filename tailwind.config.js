/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#2E7D4F", dark: "#1F5C39", light: "#E7F3EA" },
        cream: "#FBF7EE",
        ink: "#1F2937",
      },
      boxShadow: { soft: "0 2px 12px rgba(31,41,55,0.08)" },
    },
  },
  plugins: [],
};
