import {describe, it, expect} from 'vitest';
import {ZefixApiClient} from '../src';

describe('Basic client tests', () => {
	it('exports ZefixApiClient', () => {
		expect(ZefixApiClient).toBeDefined();
		expect(typeof ZefixApiClient).toBe('function');
	});

	it('throws error in browser environment', () => {
		// Mock browser environment
		const mockWindow: Window & typeof globalThis = {} as any;
		const mockDocument: Document = {} as any;
		globalThis.window = mockWindow;
		globalThis.document = mockDocument;

		expect(() => new ZefixApiClient()).toThrow(/server-side use only/);

		// Restore
		// @ts-expect-error - Deleting test mocks
		delete globalThis.window;
		// @ts-expect-error - Deleting test mocks
		delete globalThis.document;
	});
});
