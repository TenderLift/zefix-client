import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  platform: 'browser', // Critical for edge compatibility
  target: 'es2020',
  dts: {
    resolve: true,
    // Tell tsup to use our tsconfig
    compilerOptions: {
      composite: false,
      skipLibCheck: true,
    },
  },
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: true,
  splitting: false,
  // Bundle ALL dependencies including @hey-api
  noExternal: [
    /@hey-api\/client-fetch/,
    /@hey-api\/types/,
    /^\.\/generated/, // Bundle all generated code
  ],
  external: [], // No external runtime dependencies
});
