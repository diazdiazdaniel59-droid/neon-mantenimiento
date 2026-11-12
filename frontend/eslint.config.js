import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';

// =============================================================================
// NEON :: frontend - Configuracion de ESLint (flat config, ESLint 9)
// Soporta JSX via espree (ecmaFeatures.jsx) + eslint-plugin-react para que la
// regla no-unused-vars reconozca los componentes usados en JSX.
// =============================================================================
export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    plugins: { react },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: { ...globals.browser, ...globals.es2021 },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'off',
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', args: 'after-used', ignoreRestSiblings: true },
      ],
    },
  },
  {
    files: ['test/**/*.js', 'vite.config.js', 'eslint.config.js'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    ignores: ['node_modules/**', 'dist/**'],
  },
];
