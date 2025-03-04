import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        slideUp: {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(0)" },
        },
        modalIn: {
          "0%": { 
            opacity: "0",
            transform: "translate3d(-50%, -48%, 0) scale(0.96)"
          },
          "100%": {
            opacity: "1",
            transform: "translate3d(-50%, -50%, 0) scale(1)"
          }
        },
        modalOut: {
          "0%": {
            opacity: "1",
            transform: "translate3d(-50%, -50%, 0) scale(1)"
          },
          "100%": {
            opacity: "0",
            transform: "translate3d(-50%, -48%, 0) scale(0.96)"
          }
        },
        overlayIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        overlayOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" }
        },
        cardEntrance: {
          "0%": { 
            opacity: "0", 
            transform: "translateY(20px) scale(0.98)",
            filter: "blur(8px)"
          },
          "100%": { 
            opacity: "1", 
            transform: "translateY(0) scale(1)",
            filter: "blur(0)"
          }
        },
        cardHover: {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-8px)" }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fadeIn var(--animation-duration-normal) var(--ease-out)",
        "scale-in": "scaleIn var(--animation-duration-normal) var(--ease-spring)",
        "slide-up": "slideUp var(--animation-duration-fast) var(--ease-out)",
        "slide-down": "slideDown var(--animation-duration-fast) var(--ease-out)",
        "modal-in": "modalIn var(--animation-duration-normal) var(--ease-spring)",
        "modal-out": "modalOut var(--animation-duration-fast) var(--ease-out)",
        "overlay-in": "overlayIn var(--animation-duration-normal) var(--ease-out)",
        "overlay-out": "overlayOut var(--animation-duration-fast) var(--ease-out)",
        "card-entrance": "cardEntrance 0.4s var(--ease-spring) forwards",
        "card-hover": "cardHover 0.3s var(--ease-spring) forwards"
      },
      transitionTimingFunction: {
        bounce: "var(--ease-bounce)",
        out: "var(--ease-out)",
        smooth: "var(--ease-smooth)",
        spring: "var(--ease-spring)",
      },
      transitionDuration: {
        instant: "var(--animation-duration-instant)",
        fast: "var(--animation-duration-fast)",
        normal: "var(--animation-duration-normal)",
        emphasis: "var(--animation-duration-emphasis)",
      },
    },
  },
  plugins: [],
  future: {
    hoverOnlyWhenSupported: true,
  },
} satisfies Config;

export default config;
