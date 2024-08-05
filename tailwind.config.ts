import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "hero-standard": "url('/images/background_tile_standard.png')",
        "wolvesville-large": "url('/images/wolvesville_small_day.png')",
      },
    },
  },
  plugins: [],
};
export default config;
