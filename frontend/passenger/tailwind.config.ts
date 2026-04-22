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
        'primary-glow': 'var(--primary-glow)',
        'text-primary':   'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted':     'var(--text-muted)',
        success:   'var(--success)',
        error:     'var(--error)',
        warning:   'var(--warning)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, var(--primary), var(--primary-soft))',
      },
    },
  },
  plugins: [],
}

export default config
