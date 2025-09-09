import { describe, it, expect } from 'vitest';
import { configureClient, ZefixError, toBase64 } from '../src';

describe('Basic client tests', () => {
  it('exports expected functions', () => {
    expect(configureClient).toBeDefined();
    expect(typeof configureClient).toBe('function');
  });

  it('throws error in browser environment', () => {
    // Mock browser environment
    const originalWindow = global.window;
    const originalDocument = global.document;

    // @ts-ignore
    global.window = {};
    // @ts-ignore
    global.document = {};

    expect(() => configureClient()).toThrow(/server-side use only/);

    // Restore
    // @ts-ignore
    global.window = originalWindow;
    // @ts-ignore
    global.document = originalDocument;
  });

  it('ZefixError redacts auth headers', () => {
    const error = new ZefixError(401, 'AUTH_ERROR', 'Unauthorized', {
      headers: {
        Authorization: 'Basic secret123',
        'Content-Type': 'application/json',
      },
    });

    const errorString = JSON.stringify(error.body);
    expect(errorString).not.toContain('secret123');
    expect(errorString).toContain('[REDACTED]');
    expect(errorString).toContain('application/json');
  });

  it('base64 encoding works correctly', () => {
    const encoded = toBase64('user:pass');
    expect(encoded).toBe('dXNlcjpwYXNz');

    // Test with unicode
    const unicodeEncoded = toBase64('user:pässwörd');
    expect(unicodeEncoded).toBeTruthy();
    expect(unicodeEncoded.length).toBeGreaterThan(0);
  });
});
