import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        backdrop: "#0b0b13",
        accent: {
          DEFAULT: "#7f5af0",
          muted: "#5b3abd"
        }
      },
      boxShadow: {
        glow: "0 0 30px rgba(127, 90, 240, 0.45)"
      }
    }
  },
  plugins: []
};

export default config;
