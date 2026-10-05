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
          950: '#0B1528',
          900: '#0F2038',
          800: '#17324D',
          700: '#22466B',
          600: '#2A5582',
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
        textPrimary: '#0F172A',
        textSecondary: '#64748B',
        borderSubtle: '#E2E8F0',
      },
      borderRadius: {
        'btn': '10px',
        'input': '10px',
        'card': '14px',
        'panel': '16px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'glow-blue': '0 0 20px -3px rgba(37, 99, 235, 0.3)',
        'glow-indigo': '0 0 20px -3px rgba(99, 102, 241, 0.3)',
        'card-hover': '0 12px 24px -6px rgba(15, 23, 42, 0.08), 0 4px 8px -4px rgba(15, 23, 42, 0.03)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
