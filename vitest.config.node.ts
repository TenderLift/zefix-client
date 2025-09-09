import {defineConfig} from 'vitest/config';

export default defineConfig({
	test: {
		name: 'node',
		environment: 'node',
		include: ['test/**/*.test.ts', 'test/**/*.e2e.test.ts'],
		exclude: [
			'test/worker.test.ts',
			'test/**/*.worker.test.ts',
			'node_modules/**',
		],
		setupFiles: ['test/vitest.setup.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html', 'lcov'],
			include: ['src/**/*.ts'],
			exclude: [
				'src/generated/**',
				'src/**/*.d.ts',
				'src/**/*.test.ts',
				'src/**/*.spec.ts',
			],
		},
		testTimeout: 30_000,
		hookTimeout: 30_000,
	},
});
