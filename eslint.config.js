import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import importPlugin from 'eslint-plugin-import';

export default tseslint.config(
    {
        ignores: ['dist/'],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2020,
            globals: {
                ...globals.node,
            },
            parserOptions: {
                sourceType: 'module',
            },
        },
        plugins: {
            import: importPlugin,
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            // Enforce .js extension for all local imports
            'import/extensions': [
                'error',
                'ignorePackages',
                {
                    js: 'always',
                    ts: 'always',
                    tsx: 'always',
                },
            ],
        },
    },
);
