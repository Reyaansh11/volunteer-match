import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/pages/**/*.{js,ts,jsx,tsx,mdx}", "./src/components/**/*.{js,ts,jsx,tsx,mdx}", "./src/app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Primary brand color updated from teal to forest green (Stitch palette)
        brand: {
          50: "#e8f5e2",   // muted sage green / badge backgrounds (not neon)
          500: "#1b6d24",  // hover / lighter primary
          700: "#0d631b",  // primary CTA green
        },
        // Override the entire slate scale with the Stitch Material-3 palette.
        // Every existing `slate-*` class in the app automatically picks up
        // the new values — no per-file changes needed.
        slate: {
          50:  "#f4faff",   // page/section background (surface)
          100: "#e6f6ff",   // inactive tab bg, button hover (surface-container-low)
          200: "#bfcaba",   // card borders, dividers (outline-variant)
          300: "#bfcaba",   // input borders (same warm gray-green)
          400: "#707a6c",   // medium muted (outline)
          500: "#50606d",   // secondary / very muted text
          600: "#50606d",   // secondary body text
          700: "#40493d",   // primary body text, labels (on-surface-variant)
          800: "#163440",   // dark button backgrounds (inverse-surface)
          900: "#001f2a",   // headings, darkest text (on-surface)
          950: "#001219",
        }
      },
      fontFamily: {
        // next/font/google injects these CSS vars via layout.tsx
        sans:    ["var(--font-inter)",   "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-hanken)",  "ui-sans-serif", "system-ui", "sans-serif"],
      }
    }
  },
  plugins: []
};

export default config;
