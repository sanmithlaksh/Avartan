/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        space: {
          950: '#030712',
          900: '#070b19',
          850: '#0d1329',
          800: '#111827',
          700: '#1e293b',
        },
        cosmic: {
          cyan: '#00f3ff',
          blue: '#3b82f6',
          purple: '#a855f7',
          pink: '#ec4899',
          gold: '#f59e0b',
          amber: '#fbbf24',
          emerald: '#10b981'
        }
      },
      fontFamily: {
        orbit: ['Rajdhani', 'Orbitron', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-very-slow': 'spin 60s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { filter: 'drop-shadow(0 0 5px rgba(0, 243, 255, 0.4))' },
          '100%': { filter: 'drop-shadow(0 0 20px rgba(0, 243, 255, 0.8))' },
        }
      }
    },
  },
  plugins: [],
}
