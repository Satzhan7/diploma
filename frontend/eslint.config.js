import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['build'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // Same as the backend; CRA's preset never checked it either.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { ignoreRestSiblings: true },
      ],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  {
    // Colours come from semantic tokens (theme.ts / index.css) so light, dark
    // and the contrast/transparency preferences work on every page.
    files: ['src/pages/**/*.tsx', 'src/components/**/*.tsx'],
    ignores: [
      'src/components/Logo.tsx', // brand artwork
      // Rebuilt in R6.
      'src/pages/brand/Messages.tsx',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/#[0-9a-fA-F]{3,8}\\b/]',
          message: 'Use a semantic colour token instead of a hex colour.',
        },
        {
          selector: 'Literal[value=/^(gray|red|green|blue|purple|teal|orange|yellow|pink|cyan|brand|accent)\\.[0-9]{2,3}$/]',
          message: 'Use a semantic colour token (bg.*, fg.*, primary, success, warn, danger, …) instead of a palette shade.',
        },
        {
          selector: "JSXAttribute[name.name='colorScheme'] Literal[value=/^(purple|teal|green|blue)$/]",
          message: 'Use colorScheme "brand", "accent", "gray" or "red".',
        },
      ],
    },
  },
);
