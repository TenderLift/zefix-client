import type {Config as GeneratedClientConfig} from './generated/client/types.gen';
import {
	sharedClient as client,
	getRegistryByBfsCommunityId as getRegistryByBfsCommunityIdSdk,
	getCompanyByChid as getCompanyByChidSdk,
	getCompanyByEhraid as getCompanyByEhraidSdk,
	getCompanyByUid as getCompanyByUidSdk,
	getLegalForms as getLegalFormsSdk,
	getCommunities as getCommunitiesSdk,
	getSogcByDate as getSogcByDateSdk,
	getSogcPublications as getSogcPublicationsSdk,
	searchCompanies as searchCompaniesSdk,
	sharedSettings,
} from './shared-client';
import {toBase64} from './utils/node-or-worker';

export type Auth = {
	username?: string;
	password?: string;
};

export type ClientConfig = {
	baseUrl?: string;
	auth?: Auth;
	throttle?: {minIntervalMs?: number};
	customFetch?: typeof fetch;
	/**
	 * Repair the double-encoded UTF-8 ZEFIX serves in SOGC notice text
	 * (`ZÃ¼rich` → `Zürich`). Process-wide; default `true`. Set `false` to
	 * receive the upstream text verbatim. Omitting it keeps the current value.
	 */
	repairEncoding?: boolean;
};

export class ZefixApiClient {
	private lastRequestTime = 0;

	constructor(private readonly config: ClientConfig = {}) {
		// Browser environment guard
		if (globalThis.window !== undefined && typeof document !== 'undefined') {
			throw new TypeError(
				'ZEFIX API Client Error: This client is for server-side use only (Node.js, Cloudflare Workers). ' +
					'It cannot be used in browsers due to CORS restrictions on the ZEFIX API. ' +
					'Please make API calls from your backend server.',
			);
		}

		// Validate before any process-wide side effect (setConfig below).
		if (
			config.repairEncoding !== undefined &&
			typeof config.repairEncoding !== 'boolean'
		) {
			throw new TypeError(
				`ZEFIX API Client Error: repairEncoding must be a boolean, got ${typeof config.repairEncoding}.`,
			);
		}

		const clientConfig: Partial<GeneratedClientConfig> = {
			baseUrl: config.baseUrl ?? 'https://www.zefix.admin.ch/ZefixPublicREST',
		};
		if (config.customFetch) {
			clientConfig.fetch = config.customFetch;
		}

		client.setConfig(clientConfig);
		// Only an explicit value changes the process-wide setting, so a later
		// `getClient()` / `new ZefixApiClient()` cannot silently undo an opt-out.
		if (config.repairEncoding !== undefined) {
			sharedSettings.repairEncoding = config.repairEncoding;
		}

		client.interceptors.request.use(async (req: Request) => {
			const headers = new Headers(req.headers);

			if (this.config.auth?.username && this.config.auth?.password) {
				const credentials = toBase64(
					`${this.config.auth.username}:${this.config.auth.password}`,
				);
				headers.set('Authorization', `Basic ${credentials}`);
			}

			if (
				this.config.throttle?.minIntervalMs &&
				this.config.throttle.minIntervalMs > 0
			) {
				const now = Date.now();
				const timeSinceLastRequest = now - this.lastRequestTime;
				const minInterval = this.config.throttle.minIntervalMs;
				if (timeSinceLastRequest < minInterval) {
					await new Promise<void>((resolve) => {
						setTimeout(resolve, minInterval - timeSinceLastRequest);
					});
				}

				this.lastRequestTime = Date.now();
			}

			return new Request(req, {headers});
		});
	}

	public getRegistryByBfsCommunityId = getRegistryByBfsCommunityIdSdk;
	public getCommunities = getCommunitiesSdk;
	public getCompanyByChid = getCompanyByChidSdk;
	public getCompanyByEhraid = getCompanyByEhraidSdk;
	public getCompanyByUid = getCompanyByUidSdk;
	public getLegalForms = getLegalFormsSdk;
	public getSogcByDate = getSogcByDateSdk;
	public getSogcPublications = getSogcPublicationsSdk;
	public searchCompanies = searchCompaniesSdk;

	public setAuth(auth: Auth | undefined) {
		this.config.auth = auth;
	}
}
