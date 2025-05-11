const rules = {
  '@typescript-eslint/explicit-function-return-type': 'off',
  '@typescript-eslint/interface-name-prefix': 'off',
  '@typescript-eslint/no-explicit-any': 'off',
  '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  'import/first': 'error',
  'import/newline-after-import': 'error',
  'import/no-duplicates': 'error',
  'import/no-default-export': 'off',
  'import/no-named-as-default-member': 'off',
  'import/no-unresolved': [
    'error',
    { ignore: ['^@hr-drone/*', '^firebase-admin/.+'] },
  ],
  'no-unused-vars': 'off',
  'no-undef-init': 'error',
  'simple-import-sort/exports': 'error',
  'simple-import-sort/imports': 'error',
  'valid-typeof': 'off',
  'prettier/prettier': [
    'error',
    {
      tabWidth: 2,
      singleQuote: true,
      trailingComma: 'all',
      printWidth: 80,
    },
  ],
  '@typescript-eslint/naming-convention': [
    'error',
    {
      selector: 'default',
      format: ['camelCase', 'PascalCase', 'snake_case', 'UPPER_CASE'],
      filter: {
        regex: '^_.*$',
        match: false,
      },
    },
    {
      selector: 'variable',
      format: ['camelCase', 'UPPER_CASE'],
    },
    {
      selector: 'interface',
      format: ['PascalCase'],
      prefix: ['I'],
    },
    {
      selector: 'typeLike',
      format: ['PascalCase'],
    },
    {
      selector: 'variable',
      types: ['boolean'],
      format: ['PascalCase'],
      prefix: ['is', 'should', 'has', 'can', 'did', 'will'],
    },
  ],
  '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
  '@typescript-eslint/ban-types': [
    'error',
    {
      types: {
        Object: {
          message: 'Avoid using the `Object` type. Did you mean `object`?',
        },
        Function: {
          message:
            'Avoid using the `Function` type. Prefer a specific function type, like `() => void`.',
        },
        Boolean: {
          message: 'Avoid using the `Boolean` type. Did you mean `boolean`?',
          fixWith: 'boolean',
        },
        Number: {
          message: 'Avoid using the `Number` type. Did you mean `number`?',
          fixWith: 'number',
        },
        Symbol: {
          message: 'Avoid using the `Symbol` type. Did you mean `symbol`?',
          fixWith: 'symbol',
        },
        String: {
          message: 'Avoid using the `String` type. Did you mean `string`?',
          fixWith: 'string',
        },
        '{}': {
          message: 'Use Record<K, V> instead',
          fixWith: 'Record<K, V>',
        },
        object: {
          message: 'Use Record<K, V> instead',
          fixWith: 'Record<K, V>',
        },
      },
    },
  ],
};
/**
 * @type {import('eslint').Linter.FlatConfig}
 */
module.exports = {
  parser: '@typescript-eslint/parser',
  env: {
    jest: true,
    es6: true,
    node: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  parserOptions: {
    ecmaVersion: 2022,
    project: './tsconfig.eslint.json',
    sourceType: 'module',
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'plugin:prettier/recommended',
  ],
  plugins: [
    '@typescript-eslint',
    '@typescript-eslint/eslint-plugin',
    'simple-import-sort',
    'import',
  ],
  rules,
  overrides: [
    {
      files: ['*.ts'],
      rules: {
        'no-undef': 'off',
      },
    },
  ],
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      typescript: {},
    },
  },
};
