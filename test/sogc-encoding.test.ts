import {readFileSync} from 'node:fs';
import {afterEach, describe, expect, it} from 'vitest';
import {
	configureClient,
	getCompanyByUid,
	getSogcByDate,
	looksDoubleEncoded,
	type SogcPublicationAndCompanyShort,
} from '../src';

/**
 * Four records served verbatim by `GET /api/v1/sogc/bydate/2026-09-29` on
 * 2026-10-01: a German umlaut, a French `à` (C3 A0), the CP1252 path (`Ãœ`)
 * and a clean ASCII control. ZEFIX double-encodes the SOGC notice text on most
 * publication days since 2026-03-16 — see `src/text.ts`.
 */
const fixture = readFileSync(
	new URL('fixtures/sogc-bydate-2026-09-29.json', import.meta.url),
	'utf8',
);
const upstream = JSON.parse(fixture) as SogcPublicationAndCompanyShort[];

const serve =
	(body: unknown): typeof fetch =>
	async () =>
		new Response(JSON.stringify(body), {
			status: 200,
			headers: {'Content-Type': 'application/json'},
		});

const messages = (rows: SogcPublicationAndCompanyShort[] | undefined) =>
	(rows ?? []).map((row) => row.sogcPublication?.message ?? '');

afterEach(() => {
	configureClient();
});

describe('SOGC encoding repair', () => {
	it('the fixture really is double-encoded upstream', () => {
		expect(
			messages(upstream).filter((m) => looksDoubleEncoded(m)),
		).toHaveLength(3);
	});

	it('getSogcByDate repairs the notice text by default', async () => {
		configureClient({customFetch: serve(upstream)});
		const {data} = await getSogcByDate({path: {date: '2026-09-29'}});
		const out = messages(data);

		expect(out.some((m) => looksDoubleEncoded(m))).toBe(false);
		expect(out[0]).toContain('dänischer Staatsangehöriger');
		expect(out[1]).toContain('360 IA Sàrl</FT>, à <FT TYPE="S">Ormont-Dessus');
		expect(out[2]).toMatch(/[ÜßÄÖ]/);
		// Clean record and structured fields are untouched.
		expect(out[3]).toBe(messages(upstream)[3]);
		expect(data?.map((r) => r.companyShort)).toEqual(
			upstream.map((r) => r.companyShort),
		);
	});

	it('repairEncoding: false returns the upstream text verbatim', async () => {
		configureClient({customFetch: serve(upstream), repairEncoding: false});
		const {data} = await getSogcByDate({path: {date: '2026-09-29'}});

		expect(messages(data)).toEqual(messages(upstream));
	});

	it('getCompanyByUid repairs sogcPub[].message', async () => {
		const company = {
			...upstream[0].companyShort,
			sogcPub: [upstream[0].sogcPublication],
		};
		configureClient({customFetch: serve([company])});
		const {data} = await getCompanyByUid({path: {id: 'CHE115870855'}});

		expect(data?.[0]?.sogcPub?.[0]?.message).toContain('dänischer');
	});

	it('a caller-supplied responseTransformer wins', async () => {
		configureClient({customFetch: serve(upstream)});
		const {data} = await getSogcByDate({
			path: {date: '2026-09-29'},
			responseTransformer: async (raw) => raw,
		});

		expect(messages(data)).toEqual(messages(upstream));
	});
});
