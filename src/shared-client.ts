import {client as generatedClient} from './generated/client.gen';
import {
	byBfsCommunityId,
	byDate,
	get,
	list1,
	list2,
	search,
	showChid,
	showEhraid,
	showUid,
} from './generated/sdk.gen';

/**
 * Dual-package-hazard guard.
 *
 * This package ships both an ESM build (`dist/index.js`) and a CJS build
 * (`dist/index.cjs`), and `tsup` bundles a self-contained copy of the generated
 * client into each. A single process can end up loading BOTH variants — e.g. a
 * CommonJS entrypoint that statically imports us (`require` → `dist/index.cjs`)
 * alongside an ESM dependency that `await import()`s us (`import` → `dist/index.js`).
 *
 * Each variant evaluates its own `createClient()` closure, with its own `_config`
 * and its own request-interceptor chain. That means `configureClient()` called on
 * one variant is completely invisible to SDK calls resolved through the other. In
 * practice this surfaced as silent `401 Unauthorized` on `searchCompanies` (resolved
 * through an unconfigured ESM instance) while `getCompanyByUid` (resolved through the
 * configured CJS instance) kept working in the same process.
 *
 * The fix: pin ONE client instance on `globalThis`, keyed by a versioned
 * `Symbol.for(...)`, so every loaded variant shares a single config + auth
 * interceptor chain. The first variant to load wins; later variants reuse it.
 */
const SHARED_CLIENT_KEY = Symbol.for(
	'@tenderlift/zefix-client/shared-client@1',
);

type GlobalWithSharedClient = typeof globalThis & {
	[SHARED_CLIENT_KEY]?: typeof generatedClient;
};

const globalScope = globalThis as GlobalWithSharedClient;

/**
 * The process-wide ZEFIX client. All public SDK functions and `ZefixApiClient`
 * resolve their config + auth through this single instance regardless of which
 * bundle variant (ESM/CJS) the caller imported.
 */
const resolvedClient = globalScope[SHARED_CLIENT_KEY] ?? generatedClient;
globalScope[SHARED_CLIENT_KEY] = resolvedClient;
export const sharedClient = resolvedClient;

// Public SDK functions bound to the shared client. Defaulting `client` to
// `sharedClient` (rather than the variant-local generated client the raw SDK
// captures) is what makes `configureClient()` apply across bundle variants. An
// explicit `options.client` still wins because it is spread last.
export const searchCompanies = ((options) =>
	search({client: sharedClient, ...options})) as typeof search;

export const getCompanyByUid = ((options) =>
	showUid({client: sharedClient, ...options})) as typeof showUid;

export const getCompanyByChid = ((options) =>
	showChid({client: sharedClient, ...options})) as typeof showChid;

export const getCompanyByEhraid = ((options) =>
	showEhraid({client: sharedClient, ...options})) as typeof showEhraid;

export const getLegalForms = ((options) =>
	list1({client: sharedClient, ...options})) as typeof list1;

export const getCommunities = ((options) =>
	list2({client: sharedClient, ...options})) as typeof list2;

export const getRegistryByBfsCommunityId = ((options) =>
	byBfsCommunityId({
		client: sharedClient,
		...options,
	})) as typeof byBfsCommunityId;

export const getSogcByDate = ((options) =>
	byDate({client: sharedClient, ...options})) as typeof byDate;

export const getSogcPublications = ((options) =>
	get({client: sharedClient, ...options})) as typeof get;
