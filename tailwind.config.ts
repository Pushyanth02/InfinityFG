import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        terminal: {
          bg: '#0a0f0a',
          surface: '#0f1a0f',
          border: '#1a3a1a',
          green: '#00ff41',
          dim: '#00a82b',
          muted: '#2d5a2d',
          gold: '#ffd700',
          amber: '#ffb347',
          red: '#ff4444',
          blue: '#4af',
          purple: '#c084fc',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'ticker': 'ticker 20s linear infinite',
      },
      keyframes: {
        glow: {
          '0%,100%': { textShadow: '0 0 10px #00ff41, 0 0 20px #00ff41' },
          '50%': { textShadow: '0 0 20px #00ff41, 0 0 40px #00ff41, 0 0 60px #00ff41' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        ticker: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
