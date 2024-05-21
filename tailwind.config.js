/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2196F3", // Xanh dương chủ đạo
          50: "#E3F2FD",
          100: "#BBDEFB",
          200: "#90CAF9",
          300: "#64B5F6",
          400: "#42A5F5",
          500: "#2196F3",
          600: "#1E88E5",
          700: "#1976D2",
          800: "#1565C0",
          900: "#0D47A1",
        },
        secondary: {
          DEFAULT: "#FF9800", // Cam
          50: "#FFF3E0",
          100: "#FFE0B2",
          200: "#FFCC80",
          300: "#FFB74D",
          400: "#FFA726",
          500: "#FF9800",
          600: "#FB8C00",
          700: "#F57C00",
          800: "#EF6C00",
          900: "#E65100",
        },
        black: {
          DEFAULT: "#000000",
          100: "#212121",
          200: "#424242",
        },
        gray: {
          DEFAULT: "#9E9E9E",
          100: "#bdc3c7", // Light gray
          200: "#95a5a6", // Medium gray
          300: "#7f8c8d", // Dark gray
        },
        success: {
          DEFAULT: "#2ecc71", // Green
          100: "#27ae60", // Darker green
          200: "#229954", // Even darker green
        },
        warning: {
          DEFAULT: "#f39c12", // Orange
          100: "#e67e22", // Darker orange
          200: "#d35400", // Even darker orange
        },
        info: {
          DEFAULT: "#3498db", // Blue
          100: "#2980b9", // Darker blue
          200: "#2471a3", // Even darker blue
        },
      },
      fontFamily: {
        pthin: ["Poppins-Thin", "sans-serif"],
        pextralight: ["Poppins-ExtraLight", "sans-serif"],
        plight: ["Poppins-Light", "sans-serif"],
        pregular: ["Poppins-Regular", "sans-serif"],
        pmedium: ["Poppins-Medium", "sans-serif"],
        psemibold: ["Poppins-SemiBold", "sans-serif"],
        pbold: ["Poppins-Bold", "sans-serif"],
        pextrabold: ["Poppins-ExtraBold", "sans-serif"],
        pblack: ["Poppins-Black", "sans-serif"],
      },
    },
  },
  plugins: [],
};
