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
          50: '#f0f8ff', 100: '#e0f1fe', 200: '#b9e0fd', 300: '#7cc5fb',
          400: '#36a8f5', 500: '#0c8ce9', 600: '#026fc4', 700: '#03589c',
          800: '#075985', 900: '#0c4a6e', 925: '#0a3b58', 950: '#032b45',
          975: '#021f33', 985: '#010d1a', 1000: '#000814',
        },
        cyan: { 400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2' },
        safety: { green: '#10b981', yellow: '#f59e0b', red: '#ef4444' },
        ink: { DEFAULT: '#e2e8f0', muted: '#94a3b8', subtle: '#64748b' },
        neon: {
          cyan: '#22d3ee', emerald: '#34d399', amber: '#fbbf24', red: '#f87171',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif','system-ui','-apple-system','Segoe UI','Roboto','Helvetica Neue','Arial','Noto Sans','Noto Sans Devanagari','sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: { xl: '0.875rem', '2xl': '1.125rem', '3xl': '1.5rem' },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(2, 18, 33, 0.7)',
        'card-lg': '0 1px 0 0 rgba(255,255,255,0.05) inset, 0 18px 40px -18px rgba(2, 18, 33, 0.8)',
        focus: '0 0 0 2px rgba(34, 211, 238, 0.55)',
        'neon-cyan': '0 0 20px rgba(34,211,238,0.4), 0 0 60px rgba(34,211,238,0.15)',
        'neon-emerald': '0 0 20px rgba(52,211,153,0.4), 0 0 60px rgba(52,211,153,0.15)',
        'neon-amber': '0 0 20px rgba(251,191,36,0.4), 0 0 60px rgba(251,191,36,0.15)',
        'neon-red': '0 0 20px rgba(248,113,113,0.4), 0 0 60px rgba(248,113,113,0.15)',
        'glass': '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
      },
      backdropBlur: { xs: '2px' },
      keyframes: {
        'ping-soft': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.9' },
          '50%': { transform: 'scale(1.08)', opacity: '1' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.6', boxShadow: '0 0 10px rgba(34,211,238,0.3)' },
          '50%': { opacity: '1', boxShadow: '0 0 30px rgba(34,211,238,0.6)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'radar-sweep': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'wave-flow': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'sonar-ping': {
          '0%': { transform: 'scale(0.5)', opacity: '1' },
          '100%': { transform: 'scale(2.5)', opacity: '0' },
        },
        'voice-bar': {
          '0%, 100%': { height: '20%' },
          '50%': { height: '80%' },
        },
      },
      animation: {
        'ping-soft': 'ping-soft 1.6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'radar-sweep': 'radar-sweep 4s linear infinite',
        'wave-flow': 'wave-flow 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'sonar-ping': 'sonar-ping 2s ease-out infinite',
        'voice-bar': 'voice-bar 0.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}