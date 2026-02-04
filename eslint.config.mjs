import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import perfectionist from 'eslint-plugin-perfectionist';
import { defineConfig, globalIgnores } from 'eslint/config';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Perfectionist - auto-sorting
  {
    plugins: {
      perfectionist,
    },
    rules: {
      // Sort imports
      'perfectionist/sort-imports': [
        'error',
        {
          groups: [
            'type',
            ['builtin', 'external'],
            'internal-type',
            'internal',
            ['parent-type', 'sibling-type', 'index-type'],
            ['parent', 'sibling', 'index'],
            'object',
            'unknown',
          ],
          internalPattern: ['^@/.*', '^@components/.*', '^@utils/.*'],
          newlinesBetween: 'always',
          order: 'asc',
          type: 'natural',
        },
      ],
      // Sort named exports
      'perfectionist/sort-exports': ['error', { order: 'asc', type: 'natural' }],
      // Sort named imports
      'perfectionist/sort-named-imports': ['error', { order: 'asc', type: 'natural' }],
      // Sort named exports in export statements
      'perfectionist/sort-named-exports': ['error', { order: 'asc', type: 'natural' }],
      // Sort object keys
      'perfectionist/sort-objects': [
        'error',
        {
          order: 'asc',
          partitionByComment: true,
          type: 'natural',
        },
      ],
      // Sort JSX props
      'perfectionist/sort-jsx-props': [
        'error',
        {
          order: 'asc',
          type: 'natural',
        },
      ],
      // Sort enums
      'perfectionist/sort-enums': ['error', { order: 'asc', type: 'natural' }],
      // Sort interfaces
      'perfectionist/sort-interfaces': ['error', { order: 'asc', type: 'natural' }],
      // Sort type union/intersection members
      'perfectionist/sort-union-types': ['error', { order: 'asc', type: 'natural' }],
    },
  },

  // Code style rules
  {
    rules: {
      curly: ['error', 'all'],
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', next: 'block-like', prev: '*' },
        { blankLine: 'always', next: '*', prev: 'block-like' },
        { blankLine: 'any', next: 'return', prev: '*' },
      ],
    },
  },

  // Ignores
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'node_modules/**']),
]);

export default eslintConfig;
