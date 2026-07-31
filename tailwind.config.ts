import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg:       "#0f172a",
        surface:  "#1e293b",
        border:   "#334155",
        accent:   "#3b82f6",
        success:  "#22c55e",
        warning:  "#f59e0b",
        danger:   "#ef4444",
        muted:    "#94a3b8",
      },
    },
  },
  plugins: [],
};
export default config;
