import { describe, it, expect, beforeAll, vi } from 'vitest';
import { ZefixApiClient } from '../src';
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
    const searchCompaniesSpy = vi.spyOn(client, 'searchCompanies').mockResolvedValue({ companies: [{ uid: 'CHE-123.456.789' }] });
    await client.searchCompanies({ name: 'Tenderlift' });
    expect(searchCompaniesSpy).toHaveBeenCalledWith({ name: 'Tenderlift' });
  });

  it('should get a company by UID', async () => {
    const searchCompaniesSpy = vi.spyOn(client, 'searchCompanies').mockResolvedValue({ companies: [{ uid: 'CHE-123.456.789' }] });
    const getCompanyByUidSpy = vi.spyOn(client, 'getCompanyByUid').mockResolvedValue({ uid: 'CHE-123.456.789' });
    // First, search for a company to get a valid UID
    const result = await client.searchCompanies({ name: 'Tenderlift' });
    const uid = result.companies[0].uid;
    await client.getCompanyByUid({ uid });
    expect(getCompanyByUidSpy).toHaveBeenCalledWith({ uid });
  });
});
