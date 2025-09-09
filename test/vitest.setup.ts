import {beforeAll} from 'vitest';
import {client} from '../src/generated/client.gen';

// Configure the client for all tests
beforeAll(() => {
	client.setConfig({
		baseUrl: 'https://www.zefix.admin.ch/ZefixPublicREST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
		},
	});
});
