/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        primary:  { DEFAULT: '#1D6FE8', light: '#EBF3FF', dark: '#1558C0' },
        success:  { DEFAULT: '#16A34A', light: '#DCFCE7' },
        warning:  { DEFAULT: '#D97706', light: '#FEF3C7' },
        danger:   { DEFAULT: '#DC2626', light: '#FEE2E2' },
        neutral:  { 50: '#F8FAFC', 100: '#F1F5F9', 200: '#E2E8F0', 300: '#CBD5E1', 400: '#94A3B8', 500: '#64748B', 600: '#475569', 700: '#334155', 800: '#1E293B', 900: '#0F172A' },
      },
      boxShadow: {
        card: '0 1px 4px 0 rgba(0,0,0,0.06), 0 4px 16px 0 rgba(0,0,0,0.06)',
        modal: '0 8px 32px 0 rgba(0,0,0,0.18)',
      },
      borderRadius: { xl: '1rem', '2xl': '1.5rem' },
    },
  },
  plugins: [],
}
