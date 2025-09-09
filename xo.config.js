const xoConfig = [
	{
		ignores: ['dist/**', 'node_modules/**', 'src/generated/**'],
	},

	{
		prettier: true,
		space: false,
		semicolon: true,
		rules: {
			'@typescript-eslint/no-unsafe-call': 'off', // Too strict for test mocks
			'@typescript-eslint/no-unsafe-argument': 'off', // Too strict for test mocks
			'@typescript-eslint/no-unsafe-assignment': 'off', // Too strict for test mocks
			'@typescript-eslint/no-unsafe-member-access': 'off', // Too strict for test mocks
			'@typescript-eslint/no-unsafe-return': 'off', // Too strict for test mocks

			'@typescript-eslint/naming-convention': 'off', // Allow our naming conventions
			'unicorn/prevent-abbreviations': 'off', // Allow common abbreviations like 'req', 'res', 'err'
			'unicorn/filename-case': 'off', // We have files like client.gen.ts

			'import/extensions': 'off', // TypeScript handles this
			'import-x/extensions': 'off', // TypeScript handles this (new XO uses import-x)
			'n/file-extension-in-import': 'off', // TypeScript handles this
			'import-x/order': 'off', // Don't enforce import order

			// Script/CLI specific
			'unicorn/prefer-module': 'off', // We're using CommonJS in scripts
			'n/prefer-global/process': 'off', // Process is fine
			'unicorn/no-process-exit': 'off', // OK in CLI scripts
			'@typescript-eslint/no-floating-promises': 'off', // OK for main script execution
			'unicorn/prefer-top-level-await': 'off', // OK for CLI scripts

			// Style preferences
			'unicorn/text-encoding-identifier-case': 'off', // UTF-8 vs utf8
			'unicorn/no-array-for-each': 'off', // ForEach is fine
			'@typescript-eslint/prefer-nullish-coalescing': 'off', // || is fine

			// Examples specific
			'no-await-in-loop': 'off', // OK in examples
			'promise/prefer-await-to-then': 'off', // OK in examples
			'@typescript-eslint/use-unknown-in-catch-callback-variable': 'off', // OK in examples
			'no-useless-catch': 'off', // OK in examples
			'@typescript-eslint/member-ordering': 'off', // Don't enforce member ordering
			'@typescript-eslint/triple-slash-reference': 'off', // Needed for Cloudflare Workers
		},
	},
];

export default xoConfig;
