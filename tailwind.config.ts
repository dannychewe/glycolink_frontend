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
        primary: "#1565C0",
        secondary: "#2E7D32",
        accent: "#00ACC1",
        success: "#16a34a",
        warning: "#f59e0b",
        danger: "#dc2626",
        info: "#0284C7",
        ink: "#0B2942",
        background: "#f9fafb",
        surface: "#ffffff",
        text: "#1E293B",
        muted: "#6b7280",
        border: "#e5e7eb",
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
        subtle: "0 8px 24px rgba(17, 24, 39, 0.06)",
        soft: "0 4px 16px rgba(17, 24, 39, 0.04)",
      },
      fontSize: {
        "display-sm": ["2.25rem", { lineHeight: "1.1", letterSpacing: "-0.03em" }],
        "display-md": ["3rem", { lineHeight: "1.05", letterSpacing: "-0.04em" }],
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at top right, rgba(21,101,192,0.16), transparent 30%), linear-gradient(180deg, rgba(255,255,255,0.95), rgba(249,250,251,1))",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
