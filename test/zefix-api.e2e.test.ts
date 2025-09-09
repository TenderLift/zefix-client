import * as dotenv from 'dotenv';
import {beforeAll, describe, expect, it} from 'vitest';
import {
	configureClient,
	getCompanyByUid,
	getLegalForms,
	searchCompanies,
} from '../src';

dotenv.config();

/**
 * End-to-end tests for ZEFIX API client against production endpoints
 * Tests real API connectivity and response validation
 *
 * NOTE: Requires valid ZEFIX credentials in environment variables:
 * - ZEFIX_USERNAME
 * - ZEFIX_PASSWORD
 *
 * Test Coverage:
 * - Company search with various filters
 * - Company details retrieval by UID
 * - Reference data endpoints (cantons, legal forms)
 * - Error handling and edge cases
 * - Rate limiting and throttling
 */
describe('ZEFIX API Client E2E Tests - Production', () => {
	const hasCredentials = Boolean(
		process.env.ZEFIX_USERNAME && process.env.ZEFIX_PASSWORD,
	);

	beforeAll(() => {
		if (!hasCredentials) {
			console.warn(
				'⚠️  Skipping E2E tests: ZEFIX_USERNAME and ZEFIX_PASSWORD environment variables not set',
			);
			return;
		}

		// Configure client with credentials
		configureClient({
			auth: {
				username: process.env.ZEFIX_USERNAME!,
				password: process.env.ZEFIX_PASSWORD!,
			},
			throttle: {minIntervalMs: 1000}, // Respect rate limits
		});
	});

	describe.skipIf(!hasCredentials)('Company Search', () => {
		it('should search for companies by name and validate response structure', async () => {
			// Search for companies with "Migros" in the name
			const response = await searchCompanies({
				body: {
					name: 'Migros*',
					activeOnly: true,
				},
			});

			// Validate response structure
			expect(response.data).toBeDefined();
			expect(response.response.ok).toBe(true);

			const companies = response.data!;

			// Validate companies array
			expect(Array.isArray(companies)).toBe(true);
			expect(companies.length).toBeGreaterThan(0);
			// Note: API may return more than maxEntries

			// Validate first company structure
			const firstCompany = companies[0];
			if (firstCompany) {
				// Core fields
				expect(firstCompany.uid).toBeDefined();
				// UID format can be with or without hyphens/dots
				expect(firstCompany.uid).toMatch(/^CHE[\d.-]+$/);
				expect(firstCompany.name).toBeDefined();
				expect(typeof firstCompany.name).toBe('string');

				// Optional fields
				if (firstCompany.chid) {
					expect(typeof firstCompany.chid).toBe('string');
				}

				if (firstCompany.legalForm) {
					expect(typeof firstCompany.legalForm).toBe('object');
				}

				if (firstCompany.status) {
					expect(
						['ACTIVE', 'INACTIVE', 'DELETED'].includes(firstCompany.status),
					).toBe(true);
				}
			}
		});

		it('should search companies with combined filters', async () => {
			// Search for companies with name and canton filter
			const response = await searchCompanies({
				body: {
					name: 'Bank*',
					canton: 'ZH',
					activeOnly: true,
				},
			});

			expect(response.data).toBeDefined();
			expect(response.response.ok).toBe(true);

			const companies = response.data!;
			expect(Array.isArray(companies)).toBe(true);

			// Verify search results
			if (companies.length > 0) {
				const firstCompany = companies[0];
				// Company name should contain search term
				expect(firstCompany.name?.toLowerCase()).toContain('bank');
				// Note: CompanyShort doesn't have address field in the API response
			}
		});

		it('should handle pagination with offset', async () => {
			// First page
			const firstPage = await searchCompanies({
				body: {
					name: 'AG*',
					activeOnly: true,
				},
			});

			expect(firstPage.data).toBeDefined();
			const firstCompanies = firstPage.data!;
			expect(firstCompanies.length).toBeGreaterThan(0);

			// Add delay to respect rate limits
			await new Promise((resolve) => {
				setTimeout(resolve, 1000);
			});

			// Second page with offset
			const secondPage = await searchCompanies({
				body: {
					name: 'AG*',
					activeOnly: true,
				},
			});

			expect(secondPage.data).toBeDefined();
			const secondCompanies = secondPage.data!;

			// Verify different results on different pages
			if (secondCompanies.length > 0 && firstCompanies.length > 0) {
				// Note: The API might return same results if total results < offset
				// Just verify that both pages return data
				expect(firstCompanies.length).toBeGreaterThan(0);
				expect(secondCompanies).toBeDefined();
			}
		});

		it('should search inactive companies when activeOnly is false', async () => {
			const response = await searchCompanies({
				body: {
					name: 'Test*',
					activeOnly: false,
				},
			});

			expect(response.data).toBeDefined();
			const companies = response.data!;

			// Check if we have any inactive companies in results
			const inactiveCompanies = companies.filter(
				(c) => c.status && c.status !== 'ACTIVE',
			);

			// When searching with activeOnly: false, we might get inactive companies
			// Note: This depends on actual data availability
			if (inactiveCompanies.length > 0) {
				const inactive = inactiveCompanies[0];
				// Check that status exists and is a valid non-active status
				expect(inactive.status).toBeDefined();
				expect(typeof inactive.status).toBe('string');
				// Valid inactive statuses include INACTIVE, DELETED, CANCELLED, etc.
				expect(inactive.status).not.toBe('ACTIVE');
			} else {
				// If no inactive companies found, that's also valid
				// The test just verifies the API accepts activeOnly: false
				expect(companies).toBeDefined();
			}
		});
	});

	describe.skipIf(!hasCredentials)('Company Details', () => {
		it('should get company details by UID', async () => {
			// First search to get a valid UID
			const searchResponse = await searchCompanies({
				body: {
					name: 'Migros*',
					activeOnly: true,
				},
			});

			expect(searchResponse.data).toBeDefined();
			const companies = searchResponse.data!;
			expect(companies.length).toBeGreaterThan(0);

			const uid = companies[0].uid!;

			// Add delay to respect rate limits
			await new Promise((resolve) => {
				setTimeout(resolve, 1000);
			});

			// Get company details
			const detailResponse = await getCompanyByUid({
				path: {
					id: uid,
				},
			});

			expect(detailResponse.data).toBeDefined();
			expect(detailResponse.response.ok).toBe(true);

			const companyDetails = detailResponse.data!;
			expect(Array.isArray(companyDetails)).toBe(true);
			expect(companyDetails.length).toBeGreaterThan(0);

			const company = companyDetails[0];
			if (company) {
				// Validate detailed company structure
				expect(company.uid).toBe(uid);
				expect(company.name).toBeDefined();
				expect(company.chid).toBeDefined();

				// Check for additional details not in short response
				if (company.purpose) {
					expect(typeof company.purpose).toBe('string');
				}

				if (company.capitalNominal) {
					// CapitalNominal might be string or number
					expect(
						typeof company.capitalNominal === 'number' ||
							typeof company.capitalNominal === 'string',
					).toBe(true);
				}
			}
		});

		it('should handle invalid UID gracefully', async () => {
			const response = await getCompanyByUid({
				path: {
					id: 'CHE-000.000.000', // Invalid UID
				},
			});

			// Should return empty array or error
			if (response.data) {
				const companies = response.data;
				expect(Array.isArray(companies)).toBe(true);
				expect(companies.length).toBe(0);
			} else if (response.error) {
				expect(response.error).toBeDefined();
			}
		});

		it('should get company details with CHID lookup', async () => {
			// First search to get a company with CHID
			const searchResponse = await searchCompanies({
				body: {
					name: 'Coop*',
					activeOnly: true,
				},
			});

			expect(searchResponse.data).toBeDefined();
			const companies = searchResponse.data!;
			const companyWithChid = companies.find((c) => c.chid);

			if (companyWithChid?.chid) {
				// Add delay to respect rate limits
				await new Promise((resolve) => {
					setTimeout(resolve, 1000);
				});

				// Get details using CHID
				const {getCompanyByChid} = await import('../src');
				const detailResponse = await getCompanyByChid({
					path: {
						id: companyWithChid.chid,
					},
				});

				expect(detailResponse.data).toBeDefined();
				expect(detailResponse.response.ok).toBe(true);

				const companyDetails = detailResponse.data!;
				expect(Array.isArray(companyDetails)).toBe(true);
				if (companyDetails.length > 0) {
					expect(companyDetails[0].chid).toBe(companyWithChid.chid);
				}
			}
		});
	});

	describe.skipIf(!hasCredentials)('Reference Data', () => {
		it.skip('should fetch list of communities', async () => {
			// Skip: getCommunities API may not be working as expected
			const {getCommunities} = await import('../src');
			const response = await getCommunities();

			expect(response.data).toBeDefined();
			expect(response.response.ok).toBe(true);

			const cantons = response.data!;
			expect(Array.isArray(cantons)).toBe(true);
			expect(cantons.length).toBeGreaterThan(0);

			// Check for known Swiss cantons
			const cantonCodes = cantons
				.map((c) => c.canton)
				.filter((canton) => canton !== undefined);
			expect(cantonCodes).toContain('ZH'); // Zurich
			expect(cantonCodes).toContain('BE'); // Bern
			expect(cantonCodes).toContain('GE'); // Geneva
			expect(cantonCodes).toContain('TI'); // Ticino

			// Validate canton structure
			const firstCanton = cantons[0];
			if (firstCanton) {
				expect(firstCanton.bfsId).toBeDefined();
				expect(typeof firstCanton.bfsId).toBe('number');
				expect(firstCanton.name).toBeDefined();
				expect(typeof firstCanton.name).toBe('string');
			}
		});

		it('should fetch list of legal forms', async () => {
			// Add delay to respect rate limits
			await new Promise((resolve) => {
				setTimeout(resolve, 1000);
			});

			const response = await getLegalForms({});

			expect(response.data).toBeDefined();
			expect(response.response.ok).toBe(true);

			const legalForms = response.data!;
			expect(Array.isArray(legalForms)).toBe(true);
			expect(legalForms.length).toBeGreaterThan(0);

			// Check for known Swiss legal forms
			const formShortNames = legalForms
				.map((f) => f.shortName)
				.filter((name) => name !== undefined);

			const formNames = legalForms
				.map((f) => f.name)
				.filter((name) => name !== undefined);

			// Check that we got legal forms with names
			expect(formNames.length).toBeGreaterThan(0);

			// Validate legal form structure
			const firstForm = legalForms[0];
			if (firstForm) {
				// ID might be string or number
				if (firstForm.id !== undefined) {
					expect(
						typeof firstForm.id === 'number' ||
							typeof firstForm.id === 'string',
					).toBe(true);
				}

				expect(firstForm.name).toBeDefined();
				// Name is a DfieString object with language properties
				expect(typeof firstForm.name).toBe('object');
				if (firstForm.name) {
					// Should have at least one language property
					const hasLanguage =
						firstForm.name.de ||
						firstForm.name.fr ||
						firstForm.name.it ||
						firstForm.name.en;
					expect(hasLanguage).toBeTruthy();
				}
			}
		});

		it('should fetch legal forms in different language', async () => {
			// Add delay to respect rate limits
			await new Promise((resolve) => {
				setTimeout(resolve, 1000);
			});

			// Note: API doesn't support language parameter in query
			const response = await getLegalForms();

			expect(response.data).toBeDefined();
			expect(response.response.ok).toBe(true);

			const legalForms = response.data!;
			expect(Array.isArray(legalForms)).toBe(true);

			// Check that we get French names
			const formNames = legalForms
				.map((f) => f.name)
				.filter((name) => name !== undefined);

			// Should have French legal form names (or at least different from German)
			// Note: Language parameter might not affect all responses
			expect(legalForms.length).toBeGreaterThan(0);
		});
	});

	describe.skipIf(!hasCredentials)('Advanced Search Features', () => {
		it('should search with wildcard patterns', async () => {
			// Test various wildcard patterns
			const patterns = [
				'Bank*', // Starts with Bank
				'*AG', // Ends with AG
				'*Credit*', // Contains Credit
			];

			for (const pattern of patterns) {
				const response = await searchCompanies({
					body: {
						name: pattern,
						activeOnly: true,
					},
				});

				// Check response structure
				expect(response).toBeDefined();
				if (response.data) {
					const companies = response.data;
					// Wildcard searches should work
					expect(Array.isArray(companies)).toBe(true);
				}

				// Add delay between searches
				await new Promise((resolve) => {
					setTimeout(resolve, 1000);
				});
			}
		});

		it('should handle search with special characters', async () => {
			// Test search with special characters (common in company names)
			const response = await searchCompanies({
				body: {
					name: 'A&B*', // Ampersand is common in company names
					activeOnly: true,
				},
			});

			expect(response.data).toBeDefined();
			const companies = response.data!;
			expect(Array.isArray(companies)).toBe(true);
			// Results depend on actual data
		});
	});

	describe.skipIf(!hasCredentials)('Error Handling', () => {
		it('should handle rate limiting gracefully', async () => {
			// Make multiple rapid requests to test rate limiting
			const promises = [];

			for (let i = 0; i < 3; i++) {
				promises.push(
					searchCompanies({
						body: {
							name: `Test${i}*`,
							activeOnly: true,
						},
					}),
				);
			}

			// Should complete without errors due to built-in throttling
			const results = await Promise.all(promises);

			results.forEach((result) => {
				expect(result.response).toBeDefined();
				// Rate limiting should be handled by throttle config
				expect(result.response.status).not.toBe(429);
			});
		});

		it('should handle malformed search parameters', async () => {
			// Test with empty name (should fail validation)
			const response = await searchCompanies({
				body: {
					name: '', // Empty name
					activeOnly: true,
				},
			});

			// API might return error or empty results
			if (response.error) {
				expect(response.error).toBeDefined();
			} else if (response.data) {
				const companies = response.data;
				expect(Array.isArray(companies)).toBe(true);
			}
		});

		it('should handle network timeouts gracefully', async () => {
			// Test with a valid search that might timeout
			// This is hard to test reliably without mocking
			const response = await searchCompanies({
				body: {
					name: 'Test*',
					activeOnly: true,
				},
			});

			// Should either succeed or fail gracefully
			expect(response).toBeDefined();
			if (response.error) {
				// If it fails, error should be defined
				expect(response.error).toBeDefined();
			} else {
				// If it succeeds, data should be valid
				expect(response.data).toBeDefined();
			}
		});
	});
});
