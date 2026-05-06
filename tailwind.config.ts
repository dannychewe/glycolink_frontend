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
        background: "#f9fafb",
        surface: "#ffffff",
        text: "#1E293B",
        muted: "#6b7280",
        border: "#e5e7eb",
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
    },
  },
  plugins: [],
};

export default config;
