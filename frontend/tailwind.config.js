/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkbg: {
          900: "#060B14", // Pitch black-blue for main background
          800: "#0B1220", // Deep navy for cards and panels
          700: "#121C30", // Lighter navy for hovers/borders
          600: "#1A263F", // Active/selected state navy
        },
        electric: {
          500: "#008DDA", // Electric blue main brand color
          400: "#33A6E3", // Highlight electric blue
          600: "#0072B0", // Active/focused state electric blue
        },
        accent: {
          success: "#10B981", // Emerald green for admitted/done
          warning: "#F59E0B", // Amber for pending
          danger: "#EF4444",  // Red for lost/at-risk/rejected
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      }
    },
  },
  plugins: [],
}
