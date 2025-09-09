import {describe, it, expect, beforeAll, vi} from 'vitest';
import {ZefixApiClient, searchCompanies, getCompanyByUid} from '../src';
import * as dotenv from 'dotenv';

dotenv.config();

describe('ZefixApiClient integration tests', () => {
	let client: ZefixApiClient;

	beforeAll(() => {
		client = new ZefixApiClient({
			auth: {
				username: process.env.ZEFIX_USERNAME!,
				password: process.env.ZEFIX_PASSWORD!,
			},
		});
	});

	it('should search for companies', async () => {
		const searchCompaniesSpy = vi
			.spyOn(client, 'searchCompanies')
			.mockImplementation(async () => {
				return {
					data: [{uid: 'CHE-123.456.789', name: 'Test Company'}],
					error: undefined,
					request: {} as any,
					response: {} as any,
				};
			});

		const result = await client.searchCompanies({
			body: {
				name: 'Tenderlift',
				activeOnly: true,
			},
		});

		expect(searchCompaniesSpy).toHaveBeenCalledWith({
			body: {
				name: 'Tenderlift',
				activeOnly: true,
			},
		});
	});

	it('should get a company by UID', async () => {
		const searchCompaniesSpy = vi
			.spyOn(client, 'searchCompanies')
			.mockImplementation(async () => {
				return {
					data: [{uid: 'CHE-123.456.789', name: 'Test Company'}],
					error: undefined,
					request: {} as any,
					response: {} as any,
				};
			});

		const getCompanyByUidSpy = vi
			.spyOn(client, 'getCompanyByUid')
			.mockImplementation(async () => {
				return {
					data: [{uid: 'CHE-123.456.789', name: 'Test Company'}],
					error: undefined,
					request: {} as any,
					response: {} as any,
				};
			});

		// First, search for a company to get a valid UID
		const result = await client.searchCompanies({
			body: {
				name: 'Tenderlift',
				activeOnly: true,
			},
		});

		if (result.data && result.data.length > 0) {
			const {uid} = result.data[0];
			await client.getCompanyByUid({
				path: {
					id: uid || 'CHE-123.456.789',
				},
			});
			expect(getCompanyByUidSpy).toHaveBeenCalledWith({
				path: {
					id: uid,
				},
			});
		}
	});
});
