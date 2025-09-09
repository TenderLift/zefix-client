/**
 * Basic usage examples for ZEFIX API Client
 *
 * These examples show how to use the client in different scenarios.
 * Note: You'll need valid ZEFIX credentials to run these examples.
 */

import {
	configureClient,
	searchCompanies,
	getCompanyByUid,
	getLegalForms,
	getCantons,
	ensureOk,
	ZefixError,
	isCompany,
	isActiveCompany,
	formatUid,
	isValidUid,
	getDefaultLanguageForCanton,
} from '../src';

// Get credentials from environment variables
const {ZEFIX_USERNAME} = process.env;
const {ZEFIX_PASSWORD} = process.env;

if (!ZEFIX_USERNAME || !ZEFIX_PASSWORD) {
	console.error(
		'Please set ZEFIX_USERNAME and ZEFIX_PASSWORD environment variables',
	);
	process.exit(1);
}

/**
 * Example 1: Basic Configuration and Search
 */
async function basicSearch() {
	console.log('\n📋 Example 1: Basic Company Search\n');

	// Configure the client with credentials
	configureClient({
		auth: {
			username: ZEFIX_USERNAME,
			password: ZEFIX_PASSWORD,
		},
	});

	try {
		// Search for companies
		const result = await searchCompanies({
			body: {
				name: 'Swisscom*', // Use * as wildcard
				activeOnly: true,
				canton: 'BE',
			},
		});

		const data = await ensureOk(result);

		console.log(`Found ${data.companies?.length || 0} companies:`);
		data.companies?.forEach((company) => {
			if (isCompany(company)) {
				console.log(`- ${company.name} (${formatUid(company.uid || '')})`);
			}
		});
	} catch (error) {
		if (error instanceof ZefixError) {
			console.error(`API Error ${error.status}: ${error.message}`);
		} else {
			console.error('Unexpected error:', error);
		}
	}
}

/**
 * Example 2: Company Lookup with Error Handling
 */
async function companyLookup() {
	console.log('\n🏢 Example 2: Company Lookup by UID\n');

	configureClient({
		auth: {
			username: ZEFIX_USERNAME,
			password: ZEFIX_PASSWORD,
		},
	});

	const uid = 'CHE-107.810.911'; // Swisscom AG

	if (!isValidUid(uid)) {
		console.error('Invalid UID format');
		return;
	}

	try {
		const result = await getCompanyByUid({
			uid,
		});

		const company = await ensureOk(result);

		if (isCompany(company)) {
			console.log('Company Details:');
			console.log(`- Name: ${company.name}`);
			console.log(`- UID: ${formatUid(company.uid || '')}`);
			console.log(`- Canton: ${company.canton}`);
			console.log(`- Status: ${company.status}`);
			console.log(`- Active: ${isActiveCompany(company) ? 'Yes' : 'No'}`);

			if (company.address) {
				console.log(
					`- Address: ${company.address.street}, ${company.address.zipCode} ${company.address.city}`,
				);
			}
		}
	} catch (error) {
		if (error instanceof ZefixError) {
			if (error.status === 404) {
				console.error('Company not found');
			} else if (error.status === 401) {
				console.error('Authentication failed - check your credentials');
			} else {
				console.error(`API Error ${error.status}: ${error.message}`);
			}
		}
	}
}

/**
 * Example 3: Multi-language Support
 */
async function multiLanguageExample() {
	console.log('\n🌍 Example 3: Multi-language Support\n');

	configureClient({
		auth: {
			username: ZEFIX_USERNAME,
			password: ZEFIX_PASSWORD,
		},
	});

	const uid = 'CHE-107.810.911';
	const languages = ['de', 'fr', 'it', 'en'] as const;

	for (const lang of languages) {
		try {
			const result = await getCompanyByUid({
				uid,
				languageKey: lang,
			});

			const company = await ensureOk(result);
			console.log(`Company name in ${lang}: ${company.name}`);
		} catch (error) {
			console.error(`Failed to fetch in ${lang}:`, error);
		}
	}
}

/**
 * Example 4: Pagination
 */
async function paginationExample() {
	console.log('\n📑 Example 4: Pagination Example\n');

	configureClient({
		auth: {
			username: ZEFIX_USERNAME,
			password: ZEFIX_PASSWORD,
		},
		throttle: {minIntervalMs: 1000}, // Respect rate limits
	});

	const allCompanies = [];
	let offset = 0;
	const limit = 20;
	const searchTerm = 'Bank*';

	console.log(`Searching for companies matching "${searchTerm}"...`);

	while (true) {
		try {
			const result = await searchCompanies({
				body: {
					name: searchTerm,
					activeOnly: true,
					offset,
					maxEntries: limit,
				},
			});

			const data = await ensureOk(result);

			if (!data.companies || data.companies.length === 0) {
				break;
			}

			allCompanies.push(...data.companies);
			console.log(
				`Fetched ${data.companies.length} companies (total: ${allCompanies.length})`,
			);

			if (data.companies.length < limit) {
				break; // No more results
			}

			offset += limit;

			// Stop after 100 companies for this example
			if (allCompanies.length >= 100) {
				console.log('Stopping at 100 companies for this example');
				break;
			}
		} catch (error) {
			console.error('Error during pagination:', error);
			break;
		}
	}

	console.log(`\nTotal companies found: ${allCompanies.length}`);
}

/**
 * Example 5: Reference Data
 */
async function referenceDataExample() {
	console.log('\n📚 Example 5: Reference Data (Legal Forms & Cantons)\n');

	configureClient({
		auth: {
			username: ZEFIX_USERNAME,
			password: ZEFIX_PASSWORD,
		},
	});

	try {
		// Fetch legal forms
		const legalFormsResult = await getLegalForms();
		const legalForms = await ensureOk(legalFormsResult);

		console.log('Available Legal Forms:');
		legalForms.slice(0, 5).forEach((form) => {
			console.log(`- ${form.name} (ID: ${form.id})`);
		});
		console.log(`... and ${Math.max(0, legalForms.length - 5)} more`);

		// Fetch cantons
		const cantonsResult = await getCantons();
		const cantons = await ensureOk(cantonsResult);

		console.log('\nSwiss Cantons:');
		cantons.forEach((canton) => {
			const defaultLang = getDefaultLanguageForCanton(canton.code);
			console.log(
				`- ${canton.code}: ${canton.name} (default language: ${defaultLang})`,
			);
		});
	} catch (error) {
		console.error('Error fetching reference data:', error);
	}
}

/**
 * Example 6: Rate Limiting
 */
async function rateLimitingExample() {
	console.log('\n⏱️ Example 6: Rate Limiting Example\n');

	// Configure with throttling
	configureClient({
		auth: {
			username: ZEFIX_USERNAME,
			password: ZEFIX_PASSWORD,
		},
		throttle: {minIntervalMs: 1000}, // 1 second between requests
	});

	const uids = [
		'CHE-107.810.911', // Swisscom
		'CHE-105.815.381', // Migros
		'CHE-107.786.189', // Coop
	];

	console.log('Fetching companies with 1 second delay between requests...');
	const startTime = Date.now();

	for (const uid of uids) {
		try {
			const result = await getCompanyByUid({uid});
			const company = await ensureOk(result);
			console.log(`✓ Fetched: ${company.name}`);
		} catch (error) {
			console.error(`✗ Failed to fetch ${uid}:`, error);
		}
	}

	const elapsed = Date.now() - startTime;
	console.log(`\nTotal time: ${(elapsed / 1000).toFixed(2)} seconds`);
	console.log(
		`Average time per request: ${(elapsed / uids.length / 1000).toFixed(2)} seconds`,
	);
}

/**
 * Main function to run all examples
 */
async function main() {
	console.log('🇨🇭 ZEFIX API Client Examples');
	console.log('================================\n');

	// Run examples sequentially
	await basicSearch();
	await companyLookup();
	await multiLanguageExample();
	await paginationExample();
	await referenceDataExample();
	await rateLimitingExample();

	console.log('\n✅ All examples completed!');
}

// Run if executed directly
if (require.main === module) {
	main().catch((error) => {
		console.error('Fatal error:', error);
		process.exit(1);
	});
}

export {
	basicSearch,
	companyLookup,
	multiLanguageExample,
	paginationExample,
	referenceDataExample,
	rateLimitingExample,
};
