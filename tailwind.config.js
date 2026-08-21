/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        app: {
          bg: '#f1f2f5',
          surface: '#ffffff',
          border: '#e5e7eb',
          borderSubtle: '#f3f4f6',
          text: '#111827',
          textMuted: '#6b7280',
          textPlaceholder: '#9ca3af',
          primary: '#3b82f6',
          primaryHover: '#2563eb',
          toolbar: '#f9fafb',
          card: '#fafafa'
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
