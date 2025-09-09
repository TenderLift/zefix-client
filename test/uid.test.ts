import {describe, expect, it} from 'vitest';
import {
	formatUid,
	isValidUidFormat,
	normalizeUid,
	uidEquals,
	type UidCore,
} from '../src/uid';

describe('UID helpers', () => {
	describe('normalizeUid', () => {
		it('normalizes various valid input formats', () => {
			const cases: Array<[string, string]> = [
				['CHE-123.456.789', '123456789'],
				['che-123.456.789', '123456789'],
				['CHE 123 456 789', '123456789'],
				['che 123 456 789', '123456789'],
				['CHE123456789', '123456789'],
				['che123456789', '123456789'],
				['CHE-123.456.789 MWST', '123456789'],
				['CHE-123.456.789 TVA', '123456789'],
				['CHE-123.456.789 IVA', '123456789'],
				['che-123.456.789 mwst', '123456789'],
				['CHE 123.456.789 tva', '123456789'],
				['CHE.123.456.789', '123456789'],
				['123456789', '123456789'],
				['  CHE-123.456.789  ', '123456789'], // With whitespace
			];

			for (const [input, expected] of cases) {
				expect(normalizeUid(input)).toBe(expected);
			}
		});

		it('returns undefined for invalid inputs', () => {
			const invalidInputs = [
				'',
				'CHE-123.456.78', // Too short
				'CHE-123.456.7890', // Too long
				'CHE-ABC.DEF.GHI', // Letters instead of numbers
				'12345678', // 8 digits
				'1234567890', // 10 digits
				'CHE', // No numbers
				'invalid',
			];

			for (const input of invalidInputs) {
				expect(normalizeUid(input)).toBeUndefined();
			}

			// Test null and undefined separately
			expect(normalizeUid(null as any)).toBeUndefined();
			expect(normalizeUid(undefined as any)).toBeUndefined();
		});

		it('handles edge cases with mixed separators', () => {
			const cases: Array<[string, string | undefined]> = [
				['CHE.123-456 789', '123456789'],
				['CHE 123-456.789', '123456789'],
				['che-123456789', '123456789'],
				['CHE123.456.789', '123456789'],
				['CHE-123-456-789', '123456789'], // Hyphens as separators
			];

			for (const [input, expected] of cases) {
				expect(normalizeUid(input)).toBe(expected);
			}
		});
	});

	describe('formatUid', () => {
		it('formats valid UIDs to canonical format', () => {
			const cases: Array<[string, string]> = [
				['123456789', 'CHE-123.456.789'],
				['che123456789', 'CHE-123.456.789'],
				['CHE 123 456 789', 'CHE-123.456.789'],
				['CHE-123.456.789', 'CHE-123.456.789'], // Already formatted
				['CHE-123.456.789 MWST', 'CHE-123.456.789'],
				['che-987.654.321 tva', 'CHE-987.654.321'],
			];

			for (const [input, expected] of cases) {
				expect(formatUid(input)).toBe(expected);
			}
		});

		it('returns original input for invalid UIDs', () => {
			const invalidInputs = [
				'invalid',
				'CHE-123.456.78',
				'CHE-ABC.DEF.GHI',
				'',
				'12345678',
			];

			for (const input of invalidInputs) {
				expect(formatUid(input)).toBe(input);
			}
		});
	});

	describe('isValidUidFormat', () => {
		it('validates correct UID formats', () => {
			const validFormats = [
				'CHE-123.456.789',
				'che-123.456.789',
				'CHE 123 456 789',
				'CHE123456789',
				'123456789',
				'CHE-123.456.789 MWST',
				'che-987.654.321 tva',
				'CHE-111.222.333 IVA',
			];

			for (const format of validFormats) {
				expect(isValidUidFormat(format)).toBe(true);
			}
		});

		it('rejects invalid UID formats', () => {
			const invalidFormats = [
				'',
				'CHE-123.456.78',
				'CHE-123.456.7890',
				'CHE-ABC.DEF.GHI',
				'12345678',
				'1234567890',
				'invalid',
				'CHE',
			];

			for (const format of invalidFormats) {
				expect(isValidUidFormat(format)).toBe(false);
			}
		});
	});

	describe('uidEquals', () => {
		it('correctly compares UIDs ignoring formatting', () => {
			const equalPairs: Array<[string, string]> = [
				['CHE-123.456.789', 'che-123.456.789'],
				['CHE-123.456.789', 'CHE 123 456 789'],
				['CHE-123.456.789', 'CHE123456789'],
				['CHE-123.456.789', '123456789'],
				['CHE-123.456.789 MWST', 'che-123.456.789 tva'],
				['che 123 456 789 iva', 'CHE-123.456.789'],
			];

			for (const [a, b] of equalPairs) {
				expect(uidEquals(a, b)).toBe(true);
				expect(uidEquals(b, a)).toBe(true); // Symmetric
			}
		});

		it('correctly identifies non-equal UIDs', () => {
			const nonEqualPairs: Array<[string, string]> = [
				['CHE-123.456.789', 'CHE-987.654.321'],
				['CHE-111.222.333', 'CHE-444.555.666'],
				['123456789', '987654321'],
			];

			for (const [a, b] of nonEqualPairs) {
				expect(uidEquals(a, b)).toBe(false);
				expect(uidEquals(b, a)).toBe(false); // Symmetric
			}
		});

		it('returns false when comparing with invalid UIDs', () => {
			const pairs: Array<[string, string]> = [
				['CHE-123.456.789', 'invalid'],
				['invalid', 'CHE-123.456.789'],
				['invalid', 'invalid'],
				['CHE-123.456.78', 'CHE-123.456.789'],
				['', 'CHE-123.456.789'],
				['CHE-123.456.789', ''],
			];

			for (const [a, b] of pairs) {
				expect(uidEquals(a, b)).toBe(false);
			}
		});
	});

	describe('UidCore branded type', () => {
		it('can be used as a string', () => {
			const uid = normalizeUid('CHE-123.456.789');
			if (uid) {
				// Should be usable as a string
				expect(uid.length).toBe(9);
				expect(uid.charAt(0)).toBe('1');
				expect(uid.slice(0, 3)).toBe('123');
			}
		});

		it('maintains type safety', () => {
			const uid = normalizeUid('CHE-123.456.789');
			if (uid) {
				// This is a compile-time check - the type should be UidCore
				const typedUid: UidCore = uid;
				expect(typedUid).toBe('123456789');
			}
		});
	});

	describe('Real-world UID examples', () => {
		it('handles actual Swiss company UIDs', () => {
			// Some real (anonymized pattern) examples
			const realUids = [
				'CHE-105.805.461',
				'CHE-109.537.488',
				'CHE-114.868.376',
				'CHE-116.281.710',
			];

			for (const uid of realUids) {
				expect(isValidUidFormat(uid)).toBe(true);
				expect(formatUid(uid)).toBe(uid);

				// Should normalize to 9 digits
				const normalized = normalizeUid(uid);
				expect(normalized).not.toBeUndefined();
				expect(normalized?.length).toBe(9);
			}
		});
	});
});
