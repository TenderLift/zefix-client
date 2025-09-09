/// <reference types="@cloudflare/workers-types" />
/// <reference types="@cloudflare/vitest-pool-workers" />
import {fetchMock} from 'cloudflare:test';
import {afterEach, beforeAll, describe, expect, it, vi} from 'vitest';
import {client, configureClient, toBase64} from '../src/index';

beforeAll(() => {
	fetchMock.activate();
	fetchMock.disableNetConnect();
});

afterEach(() => {
	fetchMock.assertNoPendingInterceptors();
	vi.clearAllMocks();
});

describe('ZEFIX Client Configuration - Workers Runtime', () => {
	it('configures client with base URL', () => {
		configureClient({
			baseUrl: 'https://www.zefix.admin.ch/ZefixPublicREST',
		});

		// Client should be configured (we can't easily test internal state)
		expect(client).toBeDefined();
		expect(client.setConfig).toBeDefined();
	});

	it('applies auth headers to requests', async () => {
		const username = 'testuser';
		const password = 'testpass';
		const expectedAuth = `Basic ${toBase64(`${username}:${password}`)}`;

		// Configure with auth
		configureClient({
			auth: {username, password},
		});

		// Mock a simple GET request
		fetchMock
			.get('https://www.zefix.admin.ch')
			.intercept({
				path: '/ZefixPublicREST/api/v1/legalForms',
				headers: {
					Authorization: expectedAuth,
				},
			})
			.reply(200, JSON.stringify({legalForms: []}), {
				headers: {'Content-Type': 'application/json'},
			});

		// Make request through client
		const response = await client.get({
			url: '/api/v1/legalForms',
		});

		expect(response.response.ok).toBe(true);
		expect(response.data).toEqual({legalForms: []});
	});

	it('works without auth for public endpoints', async () => {
		// Configure without auth
		configureClient({});

		// Mock a request without auth requirement
		fetchMock
			.get('https://www.zefix.admin.ch')
			.intercept({
				path: '/ZefixPublicREST/api/v1/legalForms',
			})
			.reply(200, JSON.stringify({legalForms: ['AG', 'GmbH']}), {
				headers: {'Content-Type': 'application/json'},
			});

		const response = await client.get({
			url: '/api/v1/legalForms',
		});

		expect(response.response.ok).toBe(true);
		expect((response.data as any).legalForms).toContain('AG');
	});

	it('handles POST requests with body', async () => {
		configureClient({
			auth: {username: 'test', password: 'test'},
		});

		const searchBody = {
			name: 'Example',
			activeOnly: true,
		};

		// Mock POST search endpoint
		fetchMock
			.get('https://www.zefix.admin.ch')
			.intercept({
				method: 'POST',
				path: '/ZefixPublicREST/api/v1/company/search',
				body: JSON.stringify(searchBody),
			})
			.reply(
				200,
				JSON.stringify({
					companies: [{name: 'Example AG'}],
					totalCount: 1,
				}),
				{headers: {'Content-Type': 'application/json'}},
			);

		const response = await client.post({
			url: '/api/v1/company/search',
			body: searchBody,
		});

		expect(response.response.ok).toBe(true);
		expect((response.data as any).totalCount).toBe(1);
	});

	it('handles different language parameters', async () => {
		configureClient({});

		// Mock GET with query parameter
		fetchMock
			.get('https://www.zefix.admin.ch')
			.intercept({
				path: '/ZefixPublicREST/api/v1/legalForms',
				query: {languageKey: 'it'},
			})
			.reply(
				200,
				JSON.stringify({
					legalForms: ['SA', 'Sagl'],
					language: 'it',
				}),
				{headers: {'Content-Type': 'application/json'}},
			);

		const response = await client.get({
			url: '/api/v1/legalForms',
			query: {languageKey: 'it'},
		});

		expect(response.response.ok).toBe(true);
		expect((response.data as any).language).toBe('it');
	});

	it('handles error responses', async () => {
		configureClient({
			auth: {username: 'wrong', password: 'invalid'},
		});

		// Mock 401 response
		fetchMock
			.get('https://www.zefix.admin.ch')
			.intercept({
				path: '/ZefixPublicREST/api/v1/company/uid/CHE-123.456.789',
			})
			.reply(
				401,
				JSON.stringify({
					status: 401,
					error: 'Unauthorized',
					message: 'Invalid credentials',
				}),
			);

		const response = await client.get({
			url: '/api/v1/company/uid/CHE-123.456.789',
		});

		expect(response.response.ok).toBe(false);
		expect(response.response.status).toBe(401);
	});

	it('base64 encodes credentials correctly', () => {
		// Test standard credentials
		expect(toBase64('user:pass')).toBe('dXNlcjpwYXNz');

		// Test with special characters
		const specialAuth = toBase64('user@example.com:p@$$w0rd');
		expect(specialAuth).toBeDefined();
		expect(specialAuth.length).toBeGreaterThan(0);

		// Test with unicode
		const unicodeAuth = toBase64('user:pässwörd');
		expect(unicodeAuth).toBeDefined();
		expect(unicodeAuth.length).toBeGreaterThan(0);
	});
});
