/**
 * Type guards and helper functions for ZEFIX API responses
 */

import type {
	BfsCommunity,
	CompanyFull,
	CompanyShort,
	LegalForm,
	RestApiErrorResponse,
} from '../generated/types.gen';

/**
 * Check if a value is a ZEFIX error response
 */
export function isZefixError(value: unknown): value is RestApiErrorResponse {
	return (
		typeof value === 'object' &&
		value !== null &&
		'error' in value &&
		typeof (value as {error?: unknown}).error === 'object'
	);
}

/**
 * Check if a value is a company object (short or full)
 */
export function isCompany(value: unknown): value is CompanyShort | CompanyFull {
	return (
		typeof value === 'object' &&
		value !== null &&
		'uid' in value &&
		'name' in value &&
		typeof (value as {uid?: unknown}).uid === 'string' &&
		typeof (value as {name?: unknown}).name === 'string'
	);
}

/**
 * Check if a value is a full company object
 */
export function isCompanyFull(value: unknown): value is CompanyFull {
	return isCompany(value) && 'address' in value && 'purpose' in value;
}

/**
 * Check if a value is a legal form
 */
export function isLegalForm(value: unknown): value is LegalForm {
	return (
		typeof value === 'object' &&
		value !== null &&
		'id' in value &&
		'name' in value &&
		typeof (value as {id?: unknown}).id === 'number' &&
		typeof (value as {name?: unknown}).name === 'string'
	);
}

/**
 * Check if a value is a BfsCommunity
 */
export function isBfsCommunity(value: unknown): value is BfsCommunity {
	return (
		typeof value === 'object' &&
		value !== null &&
		'communityName' in value &&
		'bfsId' in value &&
		typeof (value as {communityName?: unknown}).communityName === 'string' &&
		typeof (value as {bfsId?: unknown}).bfsId === 'number'
	);
}

/**
 * Extract error message from various error types
 */
export function extractErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}

	if (isZefixError(error)) {
		return error.error?.message || 'Unknown error';
	}

	if (typeof error === 'string') {
		return error;
	}

	if (typeof error === 'object' && error !== null && 'message' in error) {
		return String((error as {message?: unknown}).message);
	}

	return 'An unknown error occurred';
}

/**
 * Check if a company is active
 */
export function isActiveCompany(company: CompanyShort | CompanyFull): boolean {
	return company.status === 'ACTIVE';
}

/**
 * Swiss canton codes
 */
export const SWISS_CANTONS = [
	'AG',
	'AI',
	'AR',
	'BE',
	'BL',
	'BS',
	'FR',
	'GE',
	'GL',
	'GR',
	'JU',
	'LU',
	'NE',
	'NW',
	'OW',
	'SG',
	'SH',
	'SO',
	'SZ',
	'TG',
	'TI',
	'UR',
	'VD',
	'VS',
	'ZG',
	'ZH',
] as const;

export type SwissCanton = (typeof SWISS_CANTONS)[number];

/**
 * Check if a string is a valid Swiss canton code
 */
export function isValidCanton(canton: string): canton is SwissCanton {
	return SWISS_CANTONS.includes(canton.toUpperCase() as SwissCanton);
}

/**
 * Language codes supported by ZEFIX
 */
export const ZEFIX_LANGUAGES = ['de', 'fr', 'it', 'en'] as const;
export type ZefixLanguage = (typeof ZEFIX_LANGUAGES)[number];

/**
 * Check if a language is supported by ZEFIX
 */
export function isValidLanguage(lang: string): lang is ZefixLanguage {
	return ZEFIX_LANGUAGES.includes(lang.toLowerCase() as ZefixLanguage);
}

/**
 * Get default language based on canton
 */
export function getDefaultLanguageForCanton(
	canton: SwissCanton,
): ZefixLanguage {
	const frenchCantons: SwissCanton[] = ['FR', 'GE', 'JU', 'NE', 'VD', 'VS'];
	const italianCantons: SwissCanton[] = ['TI'];

	if (italianCantons.includes(canton)) return 'it';
	if (frenchCantons.includes(canton)) return 'fr';
	return 'de';
}
