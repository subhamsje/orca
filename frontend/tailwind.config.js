/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ocean: {
          50: '#f0f8ff',
          100: '#e0f1fe',
          500: '#0284c7',
          800: '#075985',
          900: '#0c4a6e',
          950: '#032b45',
        },
        safety: {
          green: '#10b981',
          yellow: '#f59e0b',
          red: '#ef4444',
        }
      }
    },
  },
  plugins: [],
}
