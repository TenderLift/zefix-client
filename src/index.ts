import {ZefixApiClient, type ClientConfig} from './client';

export {ZefixApiClient} from './client';

// Generated client and SDK exports
export {client} from './generated/client.gen';
export {
	list2 as getCommunities,
	showChid as getCompanyByChid,
	showEhraid as getCompanyByEhraid,
	showUid as getCompanyByUid,
	list1 as getLegalForms,
	byBfsCommunityId as getRegistryByBfsCommunityId,
	byDate as getSogcByDate,
	get as getSogcPublications,
	search as searchCompanies,
} from './generated/sdk.gen';

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
