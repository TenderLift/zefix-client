import {describe, expect, it} from 'vitest';
import {
	fixDoubleEncodedUtf8,
	looksDoubleEncoded,
	repairStringsDeep,
} from '../src/text';

describe('fixDoubleEncodedUtf8', () => {
	it.each([
		['dÃ¤nischer StaatsangehÃ¶riger', 'dänischer Staatsangehöriger'],
		['ZÃ¼rich', 'Zürich'],
		['NeuchÃ¢tel, GenÃ¨ve', 'Neuchâtel, Genève'],
		// `à` is C3 A0 — the A0 survives upstream as a no-break space.
		['360 IA SÃ rl, Ã  Ormont-Dessus', '360 IA Sàrl, à Ormont-Dessus'],
		// CP1252 path: second byte in 0x80–0x9F becomes a "smart" char.
		['Die Ãœbertragbarkeit', 'Die Übertragbarkeit'],
		['gemÃ¤ÃŸ', 'gemäß'],
		['Ã„nderung, Ã–ffentlich', 'Änderung, Öffentlich'],
		['intellettuale â€” compresi', 'intellettuale — compresi'],
		['â‚¬ 100', '€ 100'],
	])('repairs %j', (input, expected) => {
		expect(fixDoubleEncodedUtf8(input)).toBe(expected);
		expect(looksDoubleEncoded(input)).toBe(true);
	});

	it.each([
		'1.8.1996 AG, in Schaffhausen',
		'Zürich — already clean',
		// Genuine characters that are not part of a UTF-8 sequence stay put.
		'BÂTIMENT',
		'Røjkjær',
		'broken upstream: �',
		'',
	])('leaves clean text untouched: %j', (input) => {
		expect(fixDoubleEncodedUtf8(input)).toBe(input);
		expect(looksDoubleEncoded(input)).toBe(false);
	});

	it('repairs only the double-encoded part of a mixed string', () => {
		// `ø` correctly single-encoded next to a double-encoded `æ`.
		expect(fixDoubleEncodedUtf8('RøjkjÃ¦r')).toBe('Røjkjær');
	});

	it('is idempotent', () => {
		const once = fixDoubleEncodedUtf8('GraubÃ¼nden, gemÃ¤ÃŸ');
		expect(fixDoubleEncodedUtf8(once)).toBe(once);
	});
});

describe('repairStringsDeep', () => {
	it('repairs every string in nested objects and arrays, leaving other values', () => {
		const input = {
			sogcPublication: {
				sogcId: 1,
				message: 'ZÃ¼rich',
				mutationTypes: [{id: 17, key: 'aenderungorgane'}],
			},
			companyShort: {name: 'Acme AG', legalSeatId: 261, deletionDate: null},
			list: ['GenÃ¨ve', 2, true],
		};
		const out = repairStringsDeep(input);
		expect(out).toEqual({
			sogcPublication: {
				sogcId: 1,
				message: 'Zürich',
				mutationTypes: [{id: 17, key: 'aenderungorgane'}],
			},
			companyShort: {name: 'Acme AG', legalSeatId: 261, deletionDate: null},
			list: ['Genève', 2, true],
		});
	});
});
