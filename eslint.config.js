import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import jsxA11y from 'eslint-plugin-jsx-a11y-x';
import globals from 'globals';

export default defineConfig(
  {
    ignores: [
      'dist',
      '.astro',
      'node_modules',
      'playwright-report',
      'test-results',
      'docs',
      'src/lib/icons.generated.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  ...astro.configs.recommended,
  ...astro.configs['jsx-a11y-recommended'],
  {
    files: ['**/*.{ts,tsx,js,mjs}'],
    languageOptions: {
      parserOptions: {
        projectService: { allowDefaultProject: ['*.config.*', 'scripts/*.mjs'] },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/*.astro'],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.astro'],
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
    },
  },
  {
    files: ['**/*.tsx'],
    plugins: { 'jsx-a11y-x': jsxA11y },
    rules: { ...jsxA11y.configs.recommended.rules },
    languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
  },
  { files: ['scripts/**/*.mjs', '*.config.*'], ...tseslint.configs.disableTypeChecked },
  {
    files: ['scripts/**/*.mjs', '*.config.*'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['src/lib/client/**', 'src/components/**/*.tsx'],
    languageOptions: { globals: globals.browser },
  },
);
