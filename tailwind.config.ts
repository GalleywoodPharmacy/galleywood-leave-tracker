import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#2563EB", // buttons, approved status, links
        accent: "#3B82F6", // highlights, hover states
        header: "#1E3A8A", // header banner, headings
        page: "#F5F8FF", // app background
        card: "#E8EFFC", // cards, table zebra
        ink: "#0F172A", // body text
        "ink-soft": "#5B6B85", // secondary text
        line: "#D7E3FA", // borders/dividers
        pending: "#C98A2C", // amber — pending/requested
        declined: "#B3413A", // red — declined
        coverage: "#7C3AED", // violet — shift coverage, kept distinct from the primary blue
      },
      fontFamily: {
        heading: ["Poppins", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;