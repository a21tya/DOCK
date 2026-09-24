/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dock: {
          bg: '#090a0f',
          surface: '#0e111a',
          card: '#131722',
          cardHover: '#181d2c',
          border: 'rgba(255, 255, 255, 0.08)',
          borderHover: 'rgba(255, 255, 255, 0.16)',
          accent: '#3b82f6',
          accentGlow: 'rgba(59, 130, 246, 0.25)',
          cyan: '#06b6d4',
          emerald: '#10b981',
          amber: '#f59e0b',
          purple: '#8b5cf6',
          muted: '#8b949e',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'dock-glow': '0 0 20px -5px rgba(59, 130, 246, 0.2)',
        'dock-panel': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
    },
  },
  plugins: [],
}
