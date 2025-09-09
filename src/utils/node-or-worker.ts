/**
 * Portable base64 encoding that works in both Workers and Node.js
 */
export const toBase64 = (s: string): string => {
  // Workers/Browser path
  if (typeof btoa !== 'undefined') {
    return btoa(s);
  }

  // Node.js path with runtime guard
  try {
    // Dynamic import to avoid bundler issues
    // @ts-expect-error - Node.js specific code in ESM build
    const { Buffer: NodeBuffer } = require('node:buffer');
    if (typeof NodeBuffer !== 'undefined') {
      return NodeBuffer.from(s, 'utf-8').toString('base64');
    }
  } catch {
    // Fall through if Node buffer not available
  }

  throw new Error('No base64 encoding available in this environment');
};
