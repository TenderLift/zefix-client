import {describe, expect, it} from 'vitest';
import {
	fixDoubleEncodedUtf8,
	looksDoubleEncoded,
	repairSogcMessages,
} from '../src/text';
import {RESIDUAL} from './residual';

/**
 * Reproduce the upstream defect: UTF-8-encode `clean`, then read every byte as
 * Windows-1252 (0x80–0x9F → CP1252 "smart" characters, undefined slots and the
 * rest → the Latin-1 character with that code).
 */
const CP1252_HIGH = [
	0x20_ac, 0x81, 0x20_1a, 0x1_92, 0x20_1e, 0x20_26, 0x20_20, 0x20_21, 0x2_c6,
	0x20_30, 0x1_60, 0x20_39, 0x1_52, 0x8d, 0x1_7d, 0x8f, 0x90, 0x20_18, 0x20_19,
	0x20_1c, 0x20_1d, 0x20_22, 0x20_13, 0x20_14, 0x2_dc, 0x21_22, 0x1_61, 0x20_3a,
	0x1_53, 0x9d, 0x1_7e, 0x1_78,
];
const doubleEncode = (clean: string): string =>
	[...new TextEncoder().encode(clean)]
		.map((byte) =>
			String.fromCodePoint(
				byte >= 0x80 && byte <= 0x9f ? CP1252_HIGH[byte - 0x80] : byte,
			),
		)
		.join('');

/** Correct text in the languages SOGC notices carry, with the punctuation they use. */
const CLEAN = [
	'1.8.1996 AG, in Schaffhausen',
	'dänischer Staatsangehöriger, in Zürich',
	'Die Übertragbarkeit der Namenaktien ist gemäß Statuten beschränkt.',
	'360 IA Sàrl, à Ormont-Dessus; société à responsabilité limitée',
	'Genossenschaft «LE CAFÉ», in Genève',
	'„Fuß“ GmbH, Gruß»',
	'«SPÄ» AG — Zweigniederlassung',
	'BÂTIMENT SA, in Neuchâtel',
	'Società «Città di Lugano», in Lugano',
	'Kowalski, Łukasz, polnischer Staatsangehöriger, in Łódź (PL)',
	'Novotný, Tomáš, tschechischer Staatsangehöriger',
	'Yılmaz, Ayşe, türkische Staatsangehörige',
	'Đặng, Thi Hoàng Diem, vietnamesische Staatsangehörige',
	'Kapital CHF 100’000 — €‚ ™',
	'Røjkjær',
];

describe('fixDoubleEncodedUtf8', () => {
	it.each(CLEAN)('repairs the double-encoded form of %j exactly', (clean) => {
		const garbled = doubleEncode(clean);
		expect(fixDoubleEncodedUtf8(garbled)).toBe(clean);
	});

	it.each(CLEAN)('leaves the correct form of %j untouched', (clean) => {
		expect(fixDoubleEncodedUtf8(clean)).toBe(clean);
		expect(looksDoubleEncoded(clean)).toBe(false);
	});

	it.each([
		// A correct accented capital before punctuation forms valid UTF-8
		// (C9 BB = ɻ, DF 93 = ߓ, C4 BB = Ļ) — not a double-encoding.
		'«CAFÉ»',
		'„Fuß“',
		'«SPÄ»',
		'société»',
		'broken upstream: �',
		'',
	])('does not invent a repair in %j', (text) => {
		expect(fixDoubleEncodedUtf8(text)).toBe(text);
	});

	it('is a fixed point: a second pass changes nothing', () => {
		for (const clean of CLEAN) {
			const once = fixDoubleEncodedUtf8(doubleEncode(clean));
			expect(fixDoubleEncodedUtf8(once)).toBe(once);
		}

		expect(fixDoubleEncodedUtf8('Â«CAFÃ‰Â»')).toBe('«CAFÉ»');
		expect(fixDoubleEncodedUtf8('«CAFÉ»')).toBe('«CAFÉ»');
	});

	it('repairs a garbled sequence next to a correct accented character', () => {
		expect(fixDoubleEncodedUtf8('Ã¼é')).toBe('üé');
		expect(fixDoubleEncodedUtf8('RøjkjÃ¦r')).toBe('Røjkjær');
	});

	it('repairs Latin Extended letters only alongside strong evidence', () => {
		// `Å‚` alone could be innocent; next to `Ã¶` it is part of the defect.
		expect(fixDoubleEncodedUtf8('Å‚')).toBe('Å‚');
		expect(fixDoubleEncodedUtf8('Å‚ Ã¶')).toBe('ł ö');
	});

	it('leaves no residual double-encoding by an independent check', () => {
		for (const clean of CLEAN) {
			expect(fixDoubleEncodedUtf8(doubleEncode(clean))).not.toMatch(RESIDUAL);
		}
	});
});

describe('repairSogcMessages', () => {
	const garbled = doubleEncode('in Zürich');

	it('repairs sogcPublication.message in SOGC records', () => {
		const input = [
			{
				sogcPublication: {sogcId: 1, message: garbled},
				companyShort: {name: 'Acme AG', legalSeat: 'Zürich'},
			},
		];
		expect(repairSogcMessages(input)).toEqual([
			{
				sogcPublication: {sogcId: 1, message: 'in Zürich'},
				companyShort: {name: 'Acme AG', legalSeat: 'Zürich'},
			},
		]);
	});

	it('repairs sogcPub[].message in company records', () => {
		const input = [
			{name: 'Acme AG', sogcPub: [{message: garbled}, {message: 'ok'}]},
		];
		expect(repairSogcMessages(input)[0]?.sogcPub).toEqual([
			{message: 'in Zürich'},
			{message: 'ok'},
		]);
	});

	it('touches no other field, even a garbled-looking one', () => {
		const input = {companyShort: {name: garbled}, purpose: garbled};
		expect(repairSogcMessages(input)).toBe(input);
	});

	it('never mutates its input (frozen records work)', () => {
		const record = Object.freeze({
			sogcPublication: Object.freeze({message: garbled}),
		});
		const out = repairSogcMessages(record);
		expect(out.sogcPublication.message).toBe('in Zürich');
		expect(record.sogcPublication.message).toBe(garbled);
	});
});
