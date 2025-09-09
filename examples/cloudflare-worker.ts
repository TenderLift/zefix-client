/**
 * Cloudflare Worker example for ZEFIX API Client
 *
 * This example shows how to use the ZEFIX client in a Cloudflare Worker
 * with KV caching and proper error handling.
 */

import {
	configureClient,
	ensureOk,
	formatUid,
	getCompanyByUid,
	isActiveCompany,
	isValidUid,
	searchCompanies,
	ZefixError,
} from '../src';

// TypeScript types for Cloudflare Worker environment
type KVNamespace = {
	get(key: string): Promise<string | undefined>;
	put(
		key: string,
		value: string,
		options?: {expirationTtl?: number},
	): Promise<void>;
};

type Env = {
	ZEFIX_USERNAME: string;
	ZEFIX_PASSWORD: string;
	COMPANY_CACHE: KVNamespace;
};

const workerHandler = {
	async fetch(request: Request, env: Env): Promise<Response> {
		// Configure client with auth from Worker secrets
		configureClient({
			auth: {
				username: env.ZEFIX_USERNAME,
				password: env.ZEFIX_PASSWORD,
			},
			throttle: {minIntervalMs: 1000}, // Respect rate limits
		});

		const url = new URL(request.url);
		const path = url.pathname;

		// CORS headers for browser requests
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		};

		// Handle CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, {headers: corsHeaders});
		}

		try {
			// Route: GET /api/company/:uid
			if (path.startsWith('/api/company/') && request.method === 'GET') {
				const uid = path.replace('/api/company/', '').toUpperCase();
				return await handleCompanyLookup(uid, env, corsHeaders);
			}

			// Route: POST /api/search
			if (path === '/api/search' && request.method === 'POST') {
				const body = await request.json();
				return await handleCompanySearch(body, corsHeaders);
			}

			// Route: GET /api/cantons
			if (path === '/api/cantons' && request.method === 'GET') {
				return await handleReferenceData('cantons', corsHeaders);
			}

			// Route: GET /api/legal-forms
			if (path === '/api/legal-forms' && request.method === 'GET') {
				return await handleReferenceData('legal-forms', corsHeaders);
			}

			// Route: GET /health
			if (path === '/health') {
				return new Response(
					JSON.stringify({
						status: 'healthy',
						service: 'zefix-client',
						timestamp: new Date().toISOString(),
					}),
					{
						headers: {
							'Content-Type': 'application/json',
							...corsHeaders,
						},
					},
				);
			}

			// 404 for unknown routes
			return new Response(
				JSON.stringify({
					error: 'Route not found',
					path,
				}),
				{
					status: 404,
					headers: {
						'Content-Type': 'application/json',
						...corsHeaders,
					},
				},
			);
		} catch (error) {
			return handleError(error, corsHeaders);
		}
	},
};

export default workerHandler;

/**
 * Handle company lookup by UID with caching
 */
async function handleCompanyLookup(
	uid: string,
	env: Env,
	corsHeaders: Record<string, string>,
): Promise<Response> {
	// Validate UID format
	if (!isValidUid(uid)) {
		return new Response(
			JSON.stringify({
				error: 'Invalid UID format',
				message: 'UID must be in format CHE-123.456.789',
			}),
			{
				status: 400,
				headers: {
					'Content-Type': 'application/json',
					...corsHeaders,
				},
			},
		);
	}

	const cacheKey = `company:${uid}`;

	// Check cache first
	const cached = await env.COMPANY_CACHE.get(cacheKey);
	if (cached) {
		console.log(`Cache hit for ${uid}`);
		return new Response(cached, {
			headers: {
				'Content-Type': 'application/json',
				'X-Cache': 'HIT',
				...corsHeaders,
			},
		});
	}

	// Fetch from ZEFIX API
	try {
		const result = await getCompanyByUid({path: {id: uid}});
		const companies = await ensureOk(result);
		const company = companies[0];

		if (!company) {
			// eslint-disable-next-line @typescript-eslint/only-throw-error
			throw new ZefixError('Company not found', 404);
		}

		// Add metadata
		const response = {
			...company,
			_metadata: {
				uid: formatUid(company.uid || ''),
				active: isActiveCompany(company),
				fetchedAt: new Date().toISOString(),
			},
		};

		const responseJson = JSON.stringify(response);

		// Cache for 24 hours
		await env.COMPANY_CACHE.put(cacheKey, responseJson, {
			expirationTtl: 86_400,
		});

		return new Response(responseJson, {
			headers: {
				'Content-Type': 'application/json',
				'X-Cache': 'MISS',
				...corsHeaders,
			},
		});
	} catch (error) {
		if (error instanceof ZefixError && error.status === 404) {
			return new Response(
				JSON.stringify({
					error: 'Company not found',
					uid,
				}),
				{
					status: 404,
					headers: {
						'Content-Type': 'application/json',
						...corsHeaders,
					},
				},
			);
		}

		throw new Error(String(error));
	}
}

/**
 * Handle company search
 */
async function handleCompanySearch(
	searchParams: any,
	corsHeaders: Record<string, string>,
): Promise<Response> {
	// Validate search parameters
	if (!searchParams.name || searchParams.name.length < 3) {
		return new Response(
			JSON.stringify({
				error: 'Invalid search parameters',
				message: 'Name must be at least 3 characters',
			}),
			{
				status: 400,
				headers: {
					'Content-Type': 'application/json',
					...corsHeaders,
				},
			},
		);
	}

	try {
		const result = await searchCompanies({
			body: {
				name: searchParams.name,
				canton: searchParams.canton,
				activeOnly: searchParams.activeOnly ?? true,
			},
		});

		const companies = await ensureOk(result);

		// Enhance response with metadata
		const response = {
			companies,
			_metadata: {
				query: searchParams.name,
				totalResults: companies.length,
				returnedResults: companies.length,
				hasMore: false, // API doesn't support pagination
			},
		};

		return new Response(JSON.stringify(response), {
			headers: {
				'Content-Type': 'application/json',
				...corsHeaders,
			},
		});
	} catch (error) {
		throw new Error(String(error));
	}
}

/**
 * Handle reference data requests
 */
async function handleReferenceData(
	type: 'cantons' | 'legal-forms',
	corsHeaders: Record<string, string>,
): Promise<Response> {
	try {
		let data: any;

		if (type === 'cantons') {
			const {getCommunities} = await import('../src');
			const result = await getCommunities();
			data = await ensureOk(result);
		} else {
			const {getLegalForms} = await import('../src');
			const result = await getLegalForms();
			data = await ensureOk(result);
		}

		return new Response(JSON.stringify(data), {
			headers: {
				'Content-Type': 'application/json',
				'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
				...corsHeaders,
			},
		});
	} catch (error) {
		throw new Error(String(error));
	}
}

/**
 * Handle errors and return appropriate HTTP response
 */
function handleError(
	error: unknown,
	corsHeaders: Record<string, string>,
): Response {
	console.error('Worker error:', error);

	if (error instanceof ZefixError) {
		return new Response(
			JSON.stringify({
				error: 'ZEFIX API Error',
				status: error.status,
				message: error.message,
				code: error.code,
			}),
			{
				status: error.status,
				headers: {
					'Content-Type': 'application/json',
					...corsHeaders,
				},
			},
		);
	}

	if (error instanceof Error) {
		return new Response(
			JSON.stringify({
				error: 'Internal Server Error',
				message: error.message,
			}),
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json',
					...corsHeaders,
				},
			},
		);
	}

	return new Response(
		JSON.stringify({
			error: 'Unknown Error',
			message: 'An unexpected error occurred',
		}),
		{
			status: 500,
			headers: {
				'Content-Type': 'application/json',
				...corsHeaders,
			},
		},
	);
}

/**
 * Example wrangler.toml configuration:
 *
 * name = "zefix-api-worker"
 * main = "src/index.ts"
 * compatibility_date = "2024-01-01"
 *
 * [[kv_namespaces]]
 * binding = "COMPANY_CACHE"
 * id = "your-kv-namespace-id"
 *
 * [vars]
 * # ZEFIX credentials should be set as secrets:
 * # wrangler secret put ZEFIX_USERNAME
 * # wrangler secret put ZEFIX_PASSWORD
 */
