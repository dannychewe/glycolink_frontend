import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.25rem",
        lg: "1.75rem",
        xl: "2rem",
        "2xl": "2.5rem",
      },
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        // Canonical GlycoLink palette — docs/03-design-system.md §4, docs/06 §2.
        // "primary" (DEFAULT) stays the single token nearly every screen already
        // references (bg-primary, text-primary/10, ...); the numbered scale is
        // additive for new design-system components that need finer steps.
        primary: {
          DEFAULT: "#127C86",
          50: "#ECFAFB",
          100: "#CFF0F2",
          200: "#A2E1E6",
          300: "#5FC7CE",
          400: "#2EAAB3",
          500: "#127C86",
          600: "#0E646D",
          700: "#0B4F56",
          800: "#083C41",
          900: "#052A2E",
        },
        // Legacy secondary/accent accents retired to the same teal family so the
        // app reads as one hue instead of blue+green+cyan.
        secondary: "#0B4F56",
        accent: "#2EAAB3",
        success: "#15A34A",
        warning: "#F59E0B",
        danger: "#EF4444",
        info: "#3B82F6",
        ink: "#052A2E",
        background: "#F8FAFA",
        surface: "#ffffff",
        text: "#343B3B",
        muted: "#6B7575",
        border: "#E2E7E7",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl: "0.875rem",
      },
      boxShadow: {
        // Flat/bordered by default (docs/03 §6, docs/06 "Shadows") — these two
        // remain only for true floating layers (dropdown/select/modal), never cards.
        subtle: "0 8px 24px rgba(17, 24, 39, 0.06)",
        soft: "0 4px 16px rgba(17, 24, 39, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
