/// <reference types="@cloudflare/workers-types" />
/// <reference types="@cloudflare/vitest-pool-workers/types" />
import {afterEach, describe, expect, it, vi} from 'vitest';
import {client, configureClient, toBase64} from '../src/index';

function mockFetch(
	expectedStatus: number,
	body: unknown,
	checkRequest?: (request: Request) => void,
) {
	const fetchSpy = vi.fn(
		async (input: RequestInfo | URL, init?: RequestInit) => {
			const request = new Request(input, init);
			checkRequest?.(request);
			return new Response(JSON.stringify(body), {
				status: expectedStatus,
				headers: {'Content-Type': 'application/json'},
			});
		},
	);
	vi.stubGlobal('fetch', fetchSpy);
	return fetchSpy;
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe('ZEFIX Client Configuration - Workers Runtime', () => {
	it('configures client with base URL', () => {
		configureClient({
			baseUrl: 'https://www.zefix.admin.ch/ZefixPublicREST',
		});

		expect(client).toBeDefined();
		expect(client.setConfig).toBeDefined();
	});

	it('applies auth headers to requests', async () => {
		const username = 'testuser';
		const password = 'testpass';
		const expectedAuth = `Basic ${toBase64(`${username}:${password}`)}`;

		configureClient({
			auth: {username, password},
		});

		const fetchSpy = mockFetch(200, {legalForms: []}, (request) => {
			expect(request.headers.get('Authorization')).toBe(expectedAuth);
		});

		const response = await client.get({
			url: '/api/v1/legalForms',
		});

		expect(fetchSpy).toHaveBeenCalledOnce();
		expect(response.response!.ok).toBe(true);
		expect(response.data).toEqual({legalForms: []});
	});

	it('works without auth for public endpoints', async () => {
		configureClient({});

		const fetchSpy = mockFetch(200, {legalForms: ['AG', 'GmbH']});

		const response = await client.get({
			url: '/api/v1/legalForms',
		});

		expect(fetchSpy).toHaveBeenCalledOnce();
		expect(response.response!.ok).toBe(true);
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

		const fetchSpy = mockFetch(
			200,
			{
				companies: [{name: 'Example AG'}],
				totalCount: 1,
			},
			async (request) => {
				expect(request.method).toBe('POST');
				expect(new URL(request.url).pathname).toBe(
					'/ZefixPublicREST/api/v1/company/search',
				);
				const body = await request.json();
				expect(body).toEqual(searchBody);
			},
		);

		const response = await client.post({
			url: '/api/v1/company/search',
			body: searchBody,
		});

		expect(fetchSpy).toHaveBeenCalledOnce();
		expect(response.response!.ok).toBe(true);
		expect((response.data as any).totalCount).toBe(1);
	});

	it('handles different language parameters', async () => {
		configureClient({});

		const fetchSpy = mockFetch(
			200,
			{
				legalForms: ['SA', 'Sagl'],
				language: 'it',
			},
			(request) => {
				const url = new URL(request.url);
				expect(url.searchParams.get('languageKey')).toBe('it');
			},
		);

		const response = await client.get({
			url: '/api/v1/legalForms',
			query: {languageKey: 'it'},
		});

		expect(fetchSpy).toHaveBeenCalledOnce();
		expect(response.response!.ok).toBe(true);
		expect((response.data as any).language).toBe('it');
	});

	it('handles error responses', async () => {
		configureClient({
			auth: {username: 'wrong', password: 'invalid'},
		});

		mockFetch(401, {
			status: 401,
			error: 'Unauthorized',
			message: 'Invalid credentials',
		});

		const response = await client.get({
			url: '/api/v1/company/uid/CHE-123.456.789',
		});

		expect(response.response!.ok).toBe(false);
		expect(response.response!.status).toBe(401);
	});

	it('base64 encodes credentials correctly', () => {
		expect(toBase64('user:pass')).toBe('dXNlcjpwYXNz');

		const specialAuth = toBase64('user@example.com:p@$$w0rd');
		expect(specialAuth).toBeDefined();
		expect(specialAuth.length).toBeGreaterThan(0);

		const unicodeAuth = toBase64('user:pässwörd');
		expect(unicodeAuth).toBeDefined();
		expect(unicodeAuth.length).toBeGreaterThan(0);
	});
});
