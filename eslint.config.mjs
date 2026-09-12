import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
    {
        ignores: [
            'dist/**',
            'lib/**',
            '.tsbuild/**',
            '.vinext/**',
            '.next/**',
            'node_modules/**',
            'public/**',
            'next-env.d.ts',
        ],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        plugins: { 'react-hooks': reactHooks },
        rules: {
            // Only the two long-stable, universally-applicable rules — the plugin's
            // "recommended"/"recommended-latest" presets bundle a much larger set of
            // React Compiler-oriented rules (static-components, purity, immutability,
            // etc.) meant for codebases opting into the compiler, which would otherwise
            // flag a large number of unrelated pre-existing patterns here.
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
        },
    },
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        rules: {
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            '@typescript-eslint/no-explicit-any': 'off',
            // The codebase uses @ts-ignore (mostly around react-leaflet's dynamic-import
            // typing quirks) rather than @ts-expect-error; not worth a sweeping rewrite
            // to satisfy this rule.
            '@typescript-eslint/ban-ts-comment': 'off',
            'no-empty': ['error', { allowEmptyCatch: true }],
        },
    },
);
