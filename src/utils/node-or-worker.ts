/**
 * Portable base64 encoding that works in both Workers and Node.js
 */
export const toBase64 = (s: string): string => {
	// Workers/Browser path
	// eslint-disable-next-line no-restricted-globals
	if (typeof btoa !== 'undefined') {
		// eslint-disable-next-line no-restricted-globals
		return btoa(s);
	}

	// Node.js path with runtime guard
	try {
		// Dynamic import to avoid bundler issues
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const {Buffer: NodeBuffer} = require('node:buffer');
		if (NodeBuffer !== undefined) {
			return NodeBuffer.from(s, 'utf-8').toString('base64');
		}
	} catch {
		// Fall through if Node buffer not available
	}

	throw new Error('No base64 encoding available in this environment');
};
