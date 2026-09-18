/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0F2337',
          800: '#17324D',
          700: '#22466B',
          100: '#E6EEF5',
        },
        brandBlue: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          light: '#EFF6FF',
        },
        tealAcc: {
          DEFAULT: '#0F766E',
          light: '#F0FDF4',
        },
        surfaceBg: '#F8FAFC',
        cardSurface: '#FFFFFF',
        textPrimary: '#1E293B',
        textSecondary: '#64748B',
        borderSubtle: '#E2E8F0',
      },
      borderRadius: {
        'btn': '8px',
        'input': '8px',
        'card': '10px',
        'panel': '12px',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
