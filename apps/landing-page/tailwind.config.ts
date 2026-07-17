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
        primary: "#008080",
        bg: "#F9FAFB",
        surface: "#FFFFFF",
        "surface-hover": "#F2F4F7",
        "text-main": "#1D2939",
        "text-muted": "#667085",
        border: "#E4E7EC",
      },
    },
  },
  plugins: [],
};

export default config;