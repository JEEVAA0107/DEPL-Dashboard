import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primaryTeal: "#345C64",
        deepTeal: "#1F3F47",
        pureWhite: "#FFFFFF",
        lightMint: "#DDF3F0",
        chartTeal: "#2E9F92",
        coralOrange: "#E96F50",
        lightBg: "#F7FAFA",
        darkText: "#252B2E",
        deplNavy: "#243746",
        deplDarkSlate: "#34495E",
        deplTeal: "#167C80",
        deplGreen: "#47865A",
        deplIndustrialBlue: "#34789A",
        deplWarmGrey: "#F2F3F3",
        deplDarkText: "#263238",
        deplBorder: "#D5D9DC",
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        '2xs': '0 1px 1px 0 rgba(0, 0, 0, 0.03)',
      }
    },
  },
  plugins: [],
};
export default config;
