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
import {repairStringsDeep} from './text';

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

/**
 * Process-wide client settings, pinned on `globalThis` for the same reason as
 * the client itself: `configureClient()` on one bundle variant must govern SDK
 * calls resolved through the other.
 */
export type SharedSettings = {
	/** Repair upstream double-encoded UTF-8 in response strings. Default `true`. */
	repairEncoding: boolean;
};

const SHARED_SETTINGS_KEY = Symbol.for(
	'@tenderlift/zefix-client/shared-settings@1',
);

const settingsScope = globalThis as typeof globalThis & {
	[SHARED_SETTINGS_KEY]?: SharedSettings;
};

export const sharedSettings: SharedSettings = settingsScope[
	SHARED_SETTINGS_KEY
] ?? {repairEncoding: true};
settingsScope[SHARED_SETTINGS_KEY] = sharedSettings;

/**
 * ZEFIX serves the SOGC notice text double-encoded (`ZÃ¼rich`) on most
 * publication days since 2026-03-16 — see `text.ts`. Every SDK function below
 * repairs its parsed response through this transformer; the repair is
 * selective and idempotent, so clean responses pass through unchanged. A
 * caller-supplied `responseTransformer` still wins (spread last).
 */
async function repairEncoding(data: unknown): Promise<unknown> {
	return sharedSettings.repairEncoding ? repairStringsDeep(data) : data;
}

// Public SDK functions bound to the shared client. Defaulting `client` to
// `sharedClient` (rather than the variant-local generated client the raw SDK
// captures) is what makes `configureClient()` apply across bundle variants. An
// explicit `options.client` still wins because it is spread last.
export const searchCompanies = ((options) =>
	search({
		client: sharedClient,
		responseTransformer: repairEncoding,
		...options,
	})) as typeof search;

export const getCompanyByUid = ((options) =>
	showUid({
		client: sharedClient,
		responseTransformer: repairEncoding,
		...options,
	})) as typeof showUid;

export const getCompanyByChid = ((options) =>
	showChid({
		client: sharedClient,
		responseTransformer: repairEncoding,
		...options,
	})) as typeof showChid;

export const getCompanyByEhraid = ((options) =>
	showEhraid({
		client: sharedClient,
		responseTransformer: repairEncoding,
		...options,
	})) as typeof showEhraid;

export const getLegalForms = ((options) =>
	list1({
		client: sharedClient,
		responseTransformer: repairEncoding,
		...options,
	})) as typeof list1;

export const getCommunities = ((options) =>
	list2({
		client: sharedClient,
		responseTransformer: repairEncoding,
		...options,
	})) as typeof list2;

export const getRegistryByBfsCommunityId = ((options) =>
	byBfsCommunityId({
		client: sharedClient,
		responseTransformer: repairEncoding,
		...options,
	})) as typeof byBfsCommunityId;

export const getSogcByDate = ((options) =>
	byDate({
		client: sharedClient,
		responseTransformer: repairEncoding,
		...options,
	})) as typeof byDate;

export const getSogcPublications = ((options) =>
	get({
		client: sharedClient,
		responseTransformer: repairEncoding,
		...options,
	})) as typeof get;
