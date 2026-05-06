// Workspace-level ESLint flat config.
// Enforces: TypeScript strictness + cross-app import boundary (see design.md § A.7).
// App-specific configs extend this and add Expo / React Native rules.

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.expo/**',
      '**/ios/**',
      '**/android/**',
      '**/*.config.js',
      '**/*.config.cjs',
      '**/*.config.mjs',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // Cross-app boundary — apps may not import from sibling apps.
      // Apps may import only from @eta/* shared packages.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '*/passenger/*',
                '*/restaurant/*',
                '*/admin/*',
                '../passenger/*',
                '../restaurant/*',
                '../admin/*',
                '../../passenger/*',
                '../../restaurant/*',
                '../../admin/*',
              ],
              message:
                'Cross-app imports are forbidden. Move shared code into a @eta/* package. See design.md § A.7.',
            },
          ],
        },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
];
