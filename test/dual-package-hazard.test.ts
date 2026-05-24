import {execSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname, join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {beforeAll, describe, expect, it} from 'vitest';

/**
 * Regression test for the dual-package hazard that produced silent
 * `401 Unauthorized` on `searchCompanies` in a mixed CJS/ESM process (see
 * `src/shared-client.ts`). The hazard only manifests when BOTH built bundles are
 * loaded in one process, so this test loads `dist/index.js` (ESM) and
 * `dist/index.cjs` (CJS) side by side and asserts they share one client + one auth
 * state. Requires a build; CI runs `pnpm build` before tests, and we build on the
 * fly if `dist/` is missing for standalone `vitest` runs.
 */

// Minimal surface of the built module, kept local so this runtime test does not
// depend on the source's generated response types.
type ZefixApi = {
	client: unknown;
	configureClient: (config: {
		auth: {username: string; password: string};
		customFetch: typeof fetch;
	}) => unknown;
	searchCompanies: (options: {
		body: {name: string; canton: string; activeOnly: boolean};
	}) => Promise<unknown>;
};

const here = dirname(fileURLToPath(import.meta.url));
const distDir = join(here, '..', 'dist');
const esmPath = join(distDir, 'index.js');
const cjsPath = join(distDir, 'index.cjs');

const requireCjs = createRequire(import.meta.url);

const loadEsm = async (): Promise<ZefixApi> =>
	(await import(pathToFileURL(esmPath).href)) as ZefixApi;
const loadCjs = (): ZefixApi => requireCjs(cjsPath) as ZefixApi;

beforeAll(() => {
	if (!existsSync(esmPath) || !existsSync(cjsPath)) {
		execSync('pnpm build', {cwd: join(here, '..'), stdio: 'inherit'});
	}
});

describe('dual-package hazard', () => {
	it('exports the same client instance from the ESM and CJS builds', async () => {
		const esm = await loadEsm();
		const cjs = loadCjs();

		expect(esm.client).toBe(cjs.client);
	});

	it('configureClient on one build authorizes SDK calls resolved through the other', async () => {
		const esm = await loadEsm();
		const cjs = loadCjs();

		const seenAuthHeaders: Array<string | undefined> = [];
		const fakeFetch: typeof fetch = async (input) => {
			const request = input as Request;
			seenAuthHeaders.push(request.headers.get('Authorization') ?? undefined);
			return new Response(
				JSON.stringify([{uid: 'CHE-123.456.789', name: 'Acme AG'}]),
				{
					status: 200,
					headers: {'Content-Type': 'application/json'},
				},
			);
		};

		// Configure auth + transport through the CJS build...
		cjs.configureClient({
			auth: {username: 'zefix-user', password: 'zefix-pass'},
			customFetch: fakeFetch,
		});

		// ...then call the SDK function exported by the ESM build. Pre-fix this
		// resolved an unconfigured ESM-local client (no fakeFetch, no auth) so the
		// fake transport was never reached.
		await esm.searchCompanies({
			body: {name: 'Acme', canton: 'ZH', activeOnly: true},
		});

		expect(seenAuthHeaders).toHaveLength(1);
		expect(seenAuthHeaders[0]).toMatch(/^Basic /);
	});
});
