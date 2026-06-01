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
        "deep-blue": "#1B4965",
        "mid-blue": "#2B5B84",
        mountain: "#4A7C96",
        mist: "#8BAFBF",
        accent: "#C1773A",
        surface: "#FFFFFF",
        "text-primary": "#1A2B34",
        "text-secondary": "#5E6F78",
        "card-border": "#E2E8ED",
      },
      borderRadius: {
        card: "14px",
      },
      fontFamily: {
        sans: ['"Inter"', "system-ui", "-apple-system", "sans-serif"],
        display: ['"Playfair Display"', "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
