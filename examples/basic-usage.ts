/**
 * Basic usage examples for ZEFIX API Client
 *
 * These examples show how to use the client in different scenarios.
 * Note: You'll need valid ZEFIX credentials to run these examples.
 */

import {
	type CompanyShort,
	configureClient,
	ensureOk,
	formatUid,
	getCommunities,
	getCompanyByUid,
	getDefaultLanguageForCanton,
	getLegalForms,
	isActiveCompany,
	isCompany,
	isValidUid,
	searchCompanies,
	ZefixError,
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

		console.log(`Found ${data.length || 0} companies:`);
		data.forEach((company) => {
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
			path: {id: uid},
		});

		const companies = await ensureOk(result);
		const company = companies[0];

		if (company && isCompany(company)) {
			console.log('Company Details:');
			console.log(`- Name: ${company.name}`);
			console.log(`- UID: ${formatUid(company.uid || '')}`);
			console.log(`- Canton: ${company.canton}`);
			console.log(`- Status: ${company.status}`);
			console.log(`- Active: ${isActiveCompany(company) ? 'Yes' : 'No'}`);

			if ('address' in company && company.address) {
				console.log(
					`- Address: ${company.address.street}, ${company.address.swissZipCode} ${company.address.city}`,
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
				path: {id: uid},
			});

			const companies = await ensureOk(result);
			const company = companies[0];
			if (company) {
				console.log(`Company name in ${lang}: ${company.name}`);
			}
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

	const allCompanies: CompanyShort[] = [];
	const searchTerm = 'Bank*';

	console.log(`Searching for companies matching "${searchTerm}"...`);
	console.log('Note: ZEFIX API does not support pagination with offset');

	try {
		const result = await searchCompanies({
			body: {
				name: searchTerm,
				activeOnly: true,
			},
		});

		const companies = await ensureOk(result);

		if (companies && companies.length > 0) {
			allCompanies.push(...companies);
			console.log(`Fetched ${companies.length} companies`);

			// Show first 10 companies as example
			const displayCount = Math.min(10, companies.length);
			console.log(`\nShowing first ${displayCount} companies:`);
			for (let i = 0; i < displayCount; i++) {
				const company = companies[i];
				console.log(`${i + 1}. ${company.name} (${company.uid})`);
			}
		} else {
			console.log('No companies found');
		}
	} catch (error) {
		console.error('Error during search:', error);
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
		const cantonsResult = await getCommunities();
		const cantons = await ensureOk(cantonsResult);

		console.log('\nSwiss Communities:');
		cantons.forEach((community) => {
			if (community.canton) {
				// @ts-expect-error Canton from API might not match our enum
				const defaultLang = getDefaultLanguageForCanton(community.canton);
				console.log(
					`- ${community.canton}: ${community.name} (BFS: ${community.bfsId}, default language: ${defaultLang})`,
				);
			}
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
			const result = await getCompanyByUid({path: {id: uid}});
			const companies = await ensureOk(result);
			if (companies.length > 0) {
				console.log(`✓ Fetched: ${companies[0].name}`);
			}
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
	rateLimitingExample,
	referenceDataExample,
};
