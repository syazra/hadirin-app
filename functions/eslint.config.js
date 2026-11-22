const tsParser = require('@typescript-eslint/parser');

module.exports = [
  {
    ignores: ['lib/**', 'node_modules/**'],
  },
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      'no-var': 'error',
      'prefer-const': 'warn',
    },
  },
];