/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'var(--text)',
        muted: 'var(--text-muted)',
        brand: 'var(--accent)',
      },
    },
  },
  plugins: [],
}
