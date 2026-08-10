import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#008080", // Kept as requested
        bg: "#ffffff",
        surface: "#FFFFFF",
        "surface-hover": "#F0F0F0",
        "text-main": "#000000",
        "text-muted": "#333333",
        border: "#000000",
      },
      boxShadow: {
        'brutal-sm': '2px 2px 0px 0px rgba(0,0,0,1)',
        'brutal': '4px 4px 0px 0px rgba(0,0,0,1)',
        'brutal-lg': '8px 8px 0px 0px rgba(0,0,0,1)',
        'brutal-hover': '6px 6px 0px 0px rgba(0,0,0,1)',
      },
      fontFamily: {
        space: ['var(--font-space)', 'sans-serif'],
        inter: ['var(--font-inter)', 'sans-serif'],
      }
    },
  },
  plugins: [],
};

export default config;