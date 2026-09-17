/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // enable dark mode based on class
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#f0f5ff',
          dark: '#0f172a'
        },
        secondary: {
          light: '#ffffff',
          dark: '#1e293b'
        },
        accent: {
          DEFAULT: '#0a4db8',
          hover: '#083d91',
          light: 'rgba(10, 77, 184, 0.08)'
        },
        danger: '#ef4444',
        success: '#10b981',
        warning: '#f59e0b'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        fadeSlideIn: 'fadeSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        slideDown: 'slideDown 0.3s ease-out'
      },
      keyframes: {
        fadeSlideIn: {
          'from': { opacity: '0', transform: 'translateY(12px)' },
          'to': { opacity: '1', transform: 'translateY(0)' }
        },
        slideDown: {
          'from': { opacity: '0', transform: 'translateY(-10px)' },
          'to': { opacity: '1', transform: 'translateY(0)' }
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
