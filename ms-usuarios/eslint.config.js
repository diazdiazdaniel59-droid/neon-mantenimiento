'use strict';

// =============================================================================
// NEON :: ms-usuarios - Configuracion de ESLint (flat config, ESLint 9)
// =============================================================================

const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node, ...globals.es2021 },
    },
    rules: {
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', args: 'after-used', ignoreRestSiblings: true },
      ],
    },
  },
  {
    ignores: ['node_modules/**'],
  },
];
