import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          teal: "#0d9488",
          "teal-hover": "#0f766e",
          "teal-soft": "#f0fdfa",
          "teal-muted": "#ccfbf1",
          ink: "#0f172a",
          accent: "#0369a1",
          "accent-soft": "#e0f2fe",
        },
      },
    },
  },
  plugins: [],
};
export default config;
