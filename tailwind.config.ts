import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
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
          DEFAULT: "#0D285F", // Deep Blue (Updated for Check-in)
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
          DEFAULT: "#FFC72C", // Gold/Amber (Updated for Check-in)
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
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // UNES Color Palette
        'unes': {
          'blue': '#0D3B66', // Header
          'card-blue': '#1D4E89', // Total Hadir
          'card-teal': '#2C7A7B', // Rata-rata Waktu
          'card-green': '#38A169', // Hari Aktif
          'card-dark-teal': '#285E61', // Persentase Kehadiran
          'card-main': '#1A365D', // Absensi Hari Ini
          'gold': '#D69E2E', // Accents
          'bg': '#F7FAFC', // Background
        },
        // Brutalist Color Palette
        'brutalist': {
          'yellow': '#FFD600',
          'cyan': '#00F0FF',
          'magenta': '#FF00E5',
          'blue': '#0066FF',
          'green': '#00FF85',
          'orange': '#FF6B00',
          'red': '#FF3838',
          'pink': '#FF69B4',
          'lime': '#CCFF00',
          'purple': '#9D00FF',
        },
        // Check-in Screen Specific Colors
        "background-light": "#FFFFFF",
        "background-dark": "#121212",
        "text-light": "#1C1C1E",
        "text-dark": "#E5E5E7",
        "gray-light": "#F2F2F7",
        "gray-dark": "#2C2C2E",
        "border-light": "#D1D1D6",
        "border-dark": "#3A3A3C",
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'brutal': '4px 4px 0px 0px rgba(0, 0, 0, 1)',
        'brutal-lg': '8px 8px 0px 0px rgba(0, 0, 0, 1)',
        'brutal-cyan': '4px 4px 0px 0px #00F0FF',
        'brutal-magenta': '4px 4px 0px 0px #FF00E5',
        'brutal-yellow': '4px 4px 0px 0px #FFD600',
      },
      borderRadius: {
        lg: "12px",
        md: "8px",
        sm: "4px",
        xl: "16px",
        "2xl": "24px",
        "3xl": "32px",
      },
      borderWidth: {
        DEFAULT: '1px',
        'brutal': '3px',
      },
      fontFamily: {
        display: ["Poppins", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'Space Mono'", "monospace"],
      },
      backgroundImage: {
        "gradient-brutal": "linear-gradient(135deg, #FFD600 0%, #FF6B00 100%)",
        "gradient-brutal-cyan": "linear-gradient(135deg, #00F0FF 0%, #0066FF 100%)",
        "gradient-brutal-pink": "linear-gradient(135deg, #FF69B4 0%, #FF00E5 100%)",
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "brutal-pop": "brutalPop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "brutal-shake": "brutalShake 0.5s ease-in-out",
        "brutal-bounce": "brutalBounce 0.6s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "fade-in": "fadeIn 0.3s ease-out",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "brutalPop": {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "50%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "brutalShake": {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-4px)" },
          "75%": { transform: "translateX(4px)" },
        },
        "brutalBounce": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "slideUp": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fadeIn": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
