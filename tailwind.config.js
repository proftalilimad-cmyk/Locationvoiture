/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: '#090A0D',
          light: '#111319',
          card: '#161922',
          border: '#252936',
        },
        ivory: {
          DEFAULT: '#F7F5F0',
          muted: '#C8C4B8',
          subtle: '#8E8B82',
        },
        champagne: {
          DEFAULT: 'var(--brand-primary, #C9A86A)',
          light: 'var(--brand-primary-light, #E5C98B)',
          dark: 'var(--brand-primary-dark, #9E7D43)',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'gold-glow': '0 0 35px -5px rgba(201, 168, 106, 0.25)',
        'glass': '0 20px 50px rgba(0, 0, 0, 0.6)',
      },
    },
  },
  plugins: [],
}
