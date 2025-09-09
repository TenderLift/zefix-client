import { describe, it, expect } from 'vitest';
import { ZefixApiClient } from '../src';

describe('Basic client tests', () => {
  it('exports ZefixApiClient', () => {
    expect(ZefixApiClient).toBeDefined();
    expect(typeof ZefixApiClient).toBe('function');
  });

  it('throws error in browser environment', () => {
    // Mock browser environment
    global.window = {};
    global.document = {};

    expect(() => new ZefixApiClient()).toThrow(/server-side use only/);

    // Restore
    delete global.window;
    delete global.document;
  });
});
