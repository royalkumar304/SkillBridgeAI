/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nexpathra: {
          bg: '#0B1020',
          secondary: '#111A2E',
          surface: '#17233A',
          surfaceHover: '#1E2D4A',
          border: 'rgba(148, 163, 184, 0.15)',
          text: '#F8FAFC',
          muted: '#94A3B8',
          blue: '#3B82F6',
          electric: '#38BDF8',
          violet: '#8B5CF6',
          indigo: '#6366F1',
        },
        brand: {
          50: '#f0f5ff',
          100: '#e5edff',
          200: '#cddbfe',
          300: '#b4c6fc',
          400: '#8da2fb',
          500: '#6366f1',
          600: '#3b82f6',
          700: '#2563eb',
          800: '#17233a',
          900: '#111a2e',
          950: '#0b1020',
        },
      },
    },
  },
  plugins: [],
}
