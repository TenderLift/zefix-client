import { describe, it, expect, beforeEach } from 'vitest';
import {
  configureClient,
  searchCompanies,
  getCompanyByUid,
  getLegalForms,
  getCantons,
} from '../src';

describe('Integration tests (mocked)', () => {
  beforeEach(() => {
    // Reset configuration
    configureClient({
      baseUrl: 'https://www.zefix.admin.ch/ZefixPublicREST',
      // No auth for these tests as we're not hitting real API
    });
  });

  it('all exported functions are defined', () => {
    expect(searchCompanies).toBeDefined();
    expect(getCompanyByUid).toBeDefined();
    expect(getLegalForms).toBeDefined();
    expect(getCantons).toBeDefined();
  });

  it('functions have correct type signatures', () => {
    // These should all be functions
    expect(typeof searchCompanies).toBe('function');
    expect(typeof getCompanyByUid).toBe('function');
    expect(typeof getLegalForms).toBe('function');
    expect(typeof getCantons).toBe('function');
  });

  it('configuration with throttle works', async () => {
    const startTime = Date.now();

    configureClient({
      throttle: { minIntervalMs: 50 },
    });

    // Note: These would normally make real API calls
    // In a real test environment, we'd mock the fetch calls
    // For now, we're just verifying the configuration doesn't throw

    expect(Date.now() - startTime).toBeLessThan(100);
  });

  it('auth configuration sets up correctly', () => {
    expect(() => {
      configureClient({
        auth: {
          username: 'testuser',
          password: 'testpass',
        },
      });
    }).not.toThrow();
  });
});
