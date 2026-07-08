import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        "surface-hover": "var(--color-surface-hover)",
        "accent-primary": "var(--color-accent-primary)",
        "accent-primary-glow": "var(--color-accent-primary-glow)",
        "accent-secondary": "var(--color-accent-secondary)",
        "accent-secondary-glow": "var(--color-accent-secondary-glow)",
        "text-main": "var(--color-text-main)",
        "text-muted": "var(--color-text-muted)",
        border: "var(--color-border)",
        sidebar: {
          bg: "var(--color-sidebar-bg)",
          text: "var(--color-sidebar-text)",
          "text-muted": "var(--color-sidebar-text-muted)",
          hover: "var(--color-sidebar-hover)",
          border: "var(--color-sidebar-border)",
          accent: "var(--color-sidebar-accent)",
        },
        glass: {
          bg: "var(--color-glass-bg)",
          border: "var(--color-glass-border)",
        },
      },
    },
  },
  plugins: [],
};
export default config;
