import type { Config } from "tailwindcss";
const {
  scrollbarGutter,
  scrollbarWidth,
  scrollbarColor,
} = require("tailwind-scrollbar-utilities");

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "hero-standard": "url('/assets/background_tile_standard.png')",
        "wolvesville-large": "url('/assets/wolvesville_small_day.png')",
      },
    },
  },
  plugins: [scrollbarGutter(), scrollbarWidth(), scrollbarColor()],
};
export default config;
