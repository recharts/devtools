import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import { importX } from 'eslint-plugin-import-x';

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
            'import-x': importX,
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            // Enforce .js extension for all local imports
            'import-x/extensions': [
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
