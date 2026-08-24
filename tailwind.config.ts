import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#15827B", // buttons, approved status, links
        accent: "#34BBB6", // highlights, hover states
        header: "#0E5F59", // header banner, headings
        page: "#F6FBFA", // app background
        card: "#E6F5F3", // cards, table zebra
        ink: "#152522", // body text
        "ink-soft": "#587370", // secondary text
        line: "#D6ECE9", // borders/dividers
        pending: "#C98A2C", // amber — pending/requested
        declined: "#B3413A", // red — declined
        coverage: "#3B6E8F", // blue — shift coverage, kept distinct from teal
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
