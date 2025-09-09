/**
 * Swiss UID (Unternehmens-Identifikationsnummer) utilities
 *
 * This module provides zero-dependency utilities for working with Swiss UIDs.
 * UIDs are the unique business identification numbers used in Switzerland,
 * typically formatted as CHE-123.456.789.
 *
 * @module uid
 */

/**
 * Branded type for normalized UID core (9 digits)
 * This ensures type safety when working with normalized UIDs
 */
export type UidCore = string & {readonly __brand: 'UidCore'};

/**
 * Regular expression matching normalized UID core format (exactly 9 digits)
 */
const UID_CORE_RE = /^\d{9}$/;

/**
 * Regular expression matching various UID input formats
 * Accepts: CHE-123.456.789, che 123 456 789, CHE123456789, with optional MWST/TVA/IVA suffix
 */
const UID_INPUT_RE = /^che[\s.-]*((?:\d[\s.]*){9})(?:\s*(?:mwst|tva|iva))?$/i;

/**
 * Normalize a UID to its core format (9 digits)
 *
 * @param input - The UID string to normalize
 * @returns The normalized UID core (9 digits) or null if invalid
 *
 * @example
 * normalizeUid('CHE-123.456.789') // '123456789'
 * normalizeUid('che 123 456 789') // '123456789'
 * normalizeUid('CHE-123.456.789 MWST') // '123456789'
 * normalizeUid('invalid') // undefined
 */
export function normalizeUid(input: string): UidCore | undefined {
	if (!input) return undefined;
	const trimmed = input.trim();

	// Try to match CHE format first
	const match = UID_INPUT_RE.exec(trimmed);

	// Extract digits either from CHE match or directly from input
	const digits = (match ? match[1] : trimmed).replaceAll(/\D/g, '');

	// Validate it's exactly 9 digits
	return UID_CORE_RE.test(digits) ? (digits as UidCore) : undefined;
}

/**
 * Format a UID for canonical display (CHE-123.456.789)
 *
 * @param input - The UID string to format
 * @returns The formatted UID or the original input if invalid
 *
 * @example
 * formatUid('123456789') // 'CHE-123.456.789'
 * formatUid('che123456789') // 'CHE-123.456.789'
 * formatUid('invalid') // 'invalid'
 */
export function formatUid(input: string): string {
	const core = normalizeUid(input);
	if (!core) return input;
	return `CHE-${core.slice(0, 3)}.${core.slice(3, 6)}.${core.slice(6)}`;
}

/**
 * Check if a string is a valid UID format (structure only, no checksum validation)
 *
 * @param input - The string to validate
 * @returns True if the input is a valid UID format
 *
 * @example
 * isValidUidFormat('CHE-123.456.789') // true
 * isValidUidFormat('che 123 456 789 MWST') // true
 * isValidUidFormat('123456789') // true
 * isValidUidFormat('invalid') // false
 */
export function isValidUidFormat(input: string): boolean {
	return normalizeUid(input) !== undefined;
}

/**
 * Check if two UIDs are equal, ignoring formatting differences
 *
 * @param a - First UID to compare
 * @param b - Second UID to compare
 * @returns True if both UIDs represent the same entity
 *
 * @example
 * uidEquals('CHE-123.456.789', 'che 123 456 789') // true
 * uidEquals('CHE-123.456.789 MWST', 'CHE123456789') // true
 * uidEquals('CHE-123.456.789', 'CHE-987.654.321') // false
 */
export function uidEquals(a: string, b: string): boolean {
	const normalizedA = normalizeUid(a);
	const normalizedB = normalizeUid(b);
	return normalizedA !== undefined && normalizedA === normalizedB;
}
