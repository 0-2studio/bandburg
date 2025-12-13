/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6366f1',
        'primary-dark': '#4f46e5',
        secondary: '#8b5cf6',
        accent: '#06b6d4',
        background: '#0f172a',
        surface: '#1e293b',
        'surface-light': '#334155',
        'text-primary': '#f8fafc',
        'text-secondary': '#cbd5e1',
        'text-muted': '#94a3b8',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        border: '#475569',
      },
      animation: {
        'pulse-slow': 'pulse 1.5s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}