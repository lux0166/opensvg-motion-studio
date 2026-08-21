/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        app: {
          bg: 'var(--app-bg)',
          surface: 'var(--app-surface)',
          border: 'var(--app-border)',
          borderSubtle: 'var(--app-border-subtle)',
          text: 'var(--app-text)',
          textMuted: 'var(--app-text-muted)',
          textPlaceholder: '#9ca3af',
          primary: 'var(--app-primary)',
          primaryHover: 'var(--app-primary-hover)',
          toolbar: 'var(--app-toolbar)',
          card: 'var(--app-card-bg)'
        }
      },
      boxShadow: {
        'soft': '0 8px 30px -4px rgba(0, 0, 0, 0.08)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.03)'
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px'
      }
    },
  },
  plugins: [],
}
