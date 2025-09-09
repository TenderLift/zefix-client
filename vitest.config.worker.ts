import {defineWorkersConfig} from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
	test: {
		poolOptions: {
			workers: {
				miniflare: {
					compatibilityDate: '2024-01-01',
					compatibilityFlags: ['nodejs_compat'],
				},
			},
		},
		include: ['test/worker.test.ts'],
	},
});
