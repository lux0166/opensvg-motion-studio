/**
 * Canonical Design System Tokens extracted directly from code.html
 * OpenSVG Studio Precision Light/Studio Theme Specification
 */
export const themeConfig = {
  colors: {
    light: {
      app: {
        bg: '#f1f2f5',
        surface: '#ffffff',
        border: '#e5e7eb',
        borderSubtle: '#f3f4f6',
        text: '#111827',
        textSecondary: '#4b5563',
        textMuted: '#6b7280',
        textPlaceholder: '#9ca3af',
        toolbar: '#f9fafb',
        toolbarBg: 'rgba(255, 255, 255, 0.85)',
        cardBg: '#fafafa',
        inputBg: '#f9fafb',
        
        // Accents
        primary: '#3b82f6',
        primaryHover: '#2563eb',
        primaryActive: '#1d4ed8',
        primaryLight: '#eff6ff',
        primaryBorder: '#bfdbfe',
        
        // Status & Decorative
        indigo: '#6366f1',
        emerald: '#10b981',
        amber: '#f59e0b',
        rose: '#ef4444',
        purple: '#8b5cf6'
      }
    },
    dark: {
      app: {
        bg: '#090a0f',
        surface: '#12131a',
        border: '#232634',
        borderSubtle: '#1a1c24',
        text: '#f3f4f6',
        textSecondary: '#cbd5e1',
        textMuted: '#9ca3af',
        textPlaceholder: '#6b7280',
        toolbar: '#12131a',
        toolbarBg: 'rgba(18, 19, 26, 0.85)',
        cardBg: '#161822',
        inputBg: '#1a1c24',
        
        // Accents
        primary: '#3b82f6',
        primaryHover: '#60a5fa',
        primaryActive: '#93c5fd',
        primaryLight: '#1e293b',
        primaryBorder: '#3b82f6',
        
        // Status & Decorative
        indigo: '#818cf8',
        emerald: '#34d399',
        amber: '#fbbf24',
        rose: '#f87171',
        purple: '#a78bfa'
      }
    }
  },
  typography: {
    fonts: {
      sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      mono: "'JetBrains Mono', 'Fira Code', monospace"
    },
    sizes: {
      '2xs': '10px',
      xs: '11px',
      sm: '12px',
      base: '13px',
      md: '14px',
      lg: '16px',
      xl: '18px'
    }
  },
  radius: {
    xs: '4px',
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '20px',
    '3xl': '24px',
    full: '9999px'
  },
  shadows: {
    soft: '0 8px 30px -4px rgba(0, 0, 0, 0.08)',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.07)',
    innerSoft: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.03)'
  },
  animation: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    smooth: '300ms cubic-bezier(0.16, 1, 0.3, 1)'
  }
} as const;

export type ThemeConfig = typeof themeConfig;
