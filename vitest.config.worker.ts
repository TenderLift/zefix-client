import {cloudflareTest} from '@cloudflare/vitest-pool-workers';
import {defineConfig} from 'vitest/config';

export default defineConfig({
	plugins: [
		cloudflareTest({
			miniflare: {
				compatibilityDate: '2024-01-01',
				compatibilityFlags: ['nodejs_compat'],
			},
		}),
	],
	test: {
		include: ['test/worker.test.ts'],
	},
});
