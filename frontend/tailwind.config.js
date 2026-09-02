/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core surface palette (deep navy → readable text on dark)
        ocean: {
          50: '#f0f8ff',
          100: '#e0f1fe',
          200: '#b9e0fd',
          300: '#7cc5fb',
          400: '#36a8f5',
          500: '#0c8ce9',
          600: '#026fc4',
          700: '#03589c',
          800: '#075985',
          900: '#0c4a6e',
          925: '#0a3b58',
          950: '#032b45',
          975: '#021f33',
        },
        // Accent — used sparingly for primary CTAs and active states
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
        // Status semantics
        safety: {
          green: '#10b981',
          yellow: '#f59e0b',
          red: '#ef4444',
        },
        // Surface tokens used by shared Card / Spinner
        ink: {
          DEFAULT: '#e2e8f0',
          muted: '#94a3b8',
          subtle: '#64748b',
        },
      },
      fontFamily: {
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'Noto Sans',
          'Noto Sans Devanagari',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(2, 18, 33, 0.7)',
        'card-lg': '0 1px 0 0 rgba(255,255,255,0.05) inset, 0 18px 40px -18px rgba(2, 18, 33, 0.8)',
        focus: '0 0 0 2px rgba(34, 211, 238, 0.55)',
      },
      keyframes: {
        'ping-soft': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.9' },
          '50%': { transform: 'scale(1.08)', opacity: '1' },
        },
      },
      animation: {
        'ping-soft': 'ping-soft 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}