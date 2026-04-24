import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg:        'var(--bg)',
        surface:   'var(--surface)',
        surface2:  'var(--surface-2)',
        primary:   'var(--primary)',
        'primary-soft': 'var(--primary-soft)',
        'primary-dark': 'var(--primary-dark)',
        border:    'var(--border)',
        'border-strong': 'var(--border-strong)',
        'text-primary':   'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted':     'var(--text-muted)',
        success:   'var(--success)',
        'success-bg': 'var(--success-bg)',
        warning:   'var(--warning)',
        'warning-bg': 'var(--warning-bg)',
        error:     'var(--error)',
        'error-bg': 'var(--error-bg)',
        info:      'var(--info)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      },
    },
  },
  plugins: [],
}

export default config
