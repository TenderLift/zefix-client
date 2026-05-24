import {ZefixApiClient, type ClientConfig} from './client';

export {ZefixApiClient} from './client';

// Shared client + SDK exports. These resolve through a single globalThis-pinned
// client so `configureClient()` applies regardless of which bundle variant
// (ESM/CJS) the caller imported — see `shared-client.ts` for the rationale.
export {
	sharedClient as client,
	getCommunities,
	getCompanyByChid,
	getCompanyByEhraid,
	getCompanyByUid,
	getLegalForms,
	getRegistryByBfsCommunityId,
	getSogcByDate,
	getSogcPublications,
	searchCompanies,
} from './shared-client';

// Utility exports
export {ensureOk, ZefixError} from './utils/errors';
export {toBase64} from './utils/node-or-worker';
export * from './utils/type-guards';

export type {Auth, ClientConfig} from './client';
export type * from './generated/types.gen';

let globalClient: ZefixApiClient | undefined;

export function configureClient(config: ClientConfig = {}): ZefixApiClient {
	globalClient = new ZefixApiClient(config);
	return globalClient;
}

export function getClient(): ZefixApiClient {
	globalClient ||= new ZefixApiClient();
	return globalClient;
}
