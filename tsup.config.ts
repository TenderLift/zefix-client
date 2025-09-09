import {defineConfig} from 'tsup';

export default defineConfig([
	// Main library build
	{
		entry: ['src/index.ts'],
		format: ['esm', 'cjs'],
		platform: 'browser', // Critical for edge compatibility
		target: 'es2020',
		dts: true,
		sourcemap: true,
		clean: true,
		treeshake: true,
		minify: true,
		splitting: false,
		// Bundle ALL dependencies including @hey-api. This is required to keep the package
		// zero-dependency.
		noExternal: [
			/@hey-api\/client-fetch/,
			/@hey-api\/types/,
			/^\.\/generated/, // Bundle all generated code
		],
		external: [], // No external runtime dependencies
	},
	// UID submodule build
	{
		entry: ['src/uid.ts'],
		format: ['esm', 'cjs'],
		platform: 'browser',
		target: 'es2020',
		dts: true,
		sourcemap: true,
		clean: false, // Don't clean, as main build already does
		treeshake: true,
		minify: true,
		splitting: false,
		outDir: 'dist',
		external: [], // No external runtime dependencies
	},
]);
