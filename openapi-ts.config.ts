import {defineConfig} from '@hey-api/openapi-ts';

export default defineConfig({
	client: '@hey-api/client-fetch',
	input:
		process.env.OAS_PATH ??
		'https://www.zefix.admin.ch/ZefixPublicREST/v3/api-docs',
	output: 'src/generated',
});
