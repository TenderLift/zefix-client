// Main client export
// Re-export configureClient and other utilities
import {ZefixApiClient, type ClientConfig} from './client';

export {ZefixApiClient} from './client';

// Generated client and SDK exports
export {client} from './generated/client.gen';
export {
	byBfsCommunityId as getCantons,
	showChid as getCompanyByChid,
	showEhraid as getCompanyByEhraid,
	showUid as getCompanyByUid,
	list2 as getLegalForms,
	byDate as getSogcByDate,
	get as getSogcPublications,
	search as searchCompanies,
} from './generated/sdk.gen';

// Utility exports
export * from './utils/type-guards';
export {toBase64} from './utils/node-or-worker';

// Type exports
export type * from './generated/types.gen';
export type {Auth, ClientConfig} from './client';

let globalClient: ZefixApiClient | undefined;

export function configureClient(config: ClientConfig = {}): ZefixApiClient {
	globalClient = new ZefixApiClient(config);
	return globalClient;
}

export function getClient(): ZefixApiClient {
	globalClient ||= new ZefixApiClient();
	return globalClient;
}
