import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      animation: {
        "gradient-x": "gradient 3s ease infinite",
        "pulse": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "text-shimmer": "textShimmer 2.5s ease-in-out infinite",
      },
      keyframes: {
        gradient: {
          "0%, 100%": {
            "background-size": "200% 200%",
            "background-position": "left center",
          },
          "50%": {
            "background-size": "200% 200%",
            "background-position": "right center",
          },
        },
        pulse: {
          "0%, 100%": {
            opacity: "1",
            filter: "brightness(1.2)",
          },
          "50%": {
            opacity: "0.7",
            filter: "brightness(0.8)",
          },
        },
        textShimmer: {
          "0%": {
            filter: "drop-shadow(0 0 6px rgba(249,115,22,0.8)) drop-shadow(0 0 10px rgba(59,130,246,0.4))",
          },
          "33%": {
            filter: "drop-shadow(0 0 10px rgba(249,115,22,0.5)) drop-shadow(0 0 14px rgba(59,130,246,0.8))",
          },
          "66%": {
            filter: "drop-shadow(0 0 6px rgba(59,130,246,0.8)) drop-shadow(0 0 10px rgba(249,115,22,0.4))",
          },
          "100%": {
            filter: "drop-shadow(0 0 6px rgba(249,115,22,0.8)) drop-shadow(0 0 10px rgba(59,130,246,0.4))",
          },
        },
      },
    },
  },
  plugins: [],
};
export default config;
