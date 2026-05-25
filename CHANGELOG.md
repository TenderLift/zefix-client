# Changelog

## 1.0.3

### Patch Changes

- 6cf737e: Fix dual-package hazard causing silent `401 Unauthorized`.

  The package ships both ESM (`dist/index.js`) and CJS (`dist/index.cjs`) builds, each
  bundling its own copy of the generated client. A process that loaded both variants —
  e.g. a CommonJS entrypoint that statically imports the client alongside an ESM
  dependency that dynamically imports it — got two independent client instances with
  separate config + interceptor chains. `configureClient()` against one was invisible to
  SDK calls resolved through the other, surfacing as `searchCompanies` returning 401 while
  `getCompanyByUid` (resolved through the configured instance) worked in the same process.

  The client is now pinned on `globalThis` (keyed by `Symbol.for`) so every loaded bundle
  variant shares a single config + auth interceptor chain. Public API is unchanged.

## 1.0.2

### Patch Changes

- efc66e3: Fix broken type guards and update all dependencies

  - Fix `isLegalForm` type guard: `LegalForm.name` is `DfieString` (object), not a string
  - Fix `isBfsCommunity` type guard: field is `name`, not `communityName`
  - Add missing `size-limit` configuration for bundle size tracking
  - Update ZEFIX OpenAPI spec to v2.7.2.3 (no breaking changes)
  - Bump all devDependencies: TypeScript 6, Vitest 4, Cloudflare pool-workers 0.15, openapi-ts 0.97
  - Migrate worker test config to new Cloudflare Vitest plugin API
  - Reduce security vulnerabilities from 10+ to 6 (all dev-only, 0 critical)

## 1.0.1

### Patch Changes

- 5e2031e: Migrate release pipeline to npm OIDC trusted publishing

## 1.0.0

### Major Changes

- Add UID utilities as zero-dependency submodule

  **BREAKING CHANGE:** UID functions are no longer exported from the main package. They are now available as a separate lightweight submodule.

  ### Migration:

  ```typescript
  // Old (no longer works):
  import { formatUid, normalizeUid } from "@tenderlift/zefix-client";

  // New:
  import { formatUid, normalizeUid } from "@tenderlift/zefix-client/uid";
  ```

  ### Features:

  - New zero-dependency UID submodule (~1KB minified)
  - Pure functions with TypeScript branded types for type safety
  - Flexible input handling (CHE-123.456.789, che 123 456 789, with VAT suffixes)
  - Functions: `normalizeUid`, `formatUid`, `isValidUidFormat`, `uidEquals`
  - Branded type `UidCore` for normalized UIDs

  This change allows users who only need UID utilities to import them without the entire ZEFIX client.

## 0.2.0

### Minor Changes

- 88d1896: Initial release of @tenderlift/zefix-client

  ## Features

  - 🚀 **Edge-ready**: Works in Cloudflare Workers, Vercel Edge, and other edge environments
  - 🔒 **Type-safe**: Full TypeScript support with generated types from OpenAPI spec
  - 📦 **Zero runtime dependencies**: Minimal bundle size with no external dependencies
  - 🔄 **Auto-generated SDK**: Always up-to-date with the latest ZEFIX API
  - 🛡️ **Built-in error handling**: Comprehensive error types and helper functions
  - ⚡ **Rate limiting support**: Built-in throttling to respect API limits
  - 🔧 **Flexible configuration**: Support for multiple authentication methods and custom settings

  ## API Coverage

  - Company search and lookup
  - Legal forms and communities data
  - SOGC publications
  - Multi-language support (DE, FR, IT, EN)
  - Validation utilities for UIDs and company data

  ## Documentation

  - Comprehensive examples for Node.js and Cloudflare Workers
  - Full API documentation
  - TypeScript type definitions

All notable changes to @tenderlift/zefix-client will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Complete production-ready setup matching simap-client quality standards
- Comprehensive test suite with Node.js and Cloudflare Workers tests
- GitHub Actions CI/CD workflows
- Code quality tools (xo, lefthook)
- Security policy and contributing guidelines
- Enhanced examples directory with multiple use cases
- Bundle size tracking with size-limit
- Type definition tests with tsd

### Changed

- Updated minimum Node.js version to 20
- Enhanced package.json with complete scripts and metadata
- Improved test infrastructure with MSW mocking

## [0.1.0] - 2025-01-09

### Added

- Initial release of ZEFIX API TypeScript client
- Zero-dependency, edge-compatible implementation
- Full TypeScript support with generated types from OpenAPI spec
- Support for all ZEFIX API endpoints:
  - Company search by name, canton, status
  - Company lookup by UID, CHID, EHRAID
  - Reference data (legal forms, cantons, SOGC publications)
- HTTP Basic Authentication support
- Built-in rate limiting/throttling
- Cloudflare Workers compatibility
- Comprehensive error handling with typed errors
- Type guards and utility functions
- Browser environment detection (prevents CORS issues)
- Examples for basic usage and Cloudflare Workers

### Technical Details

- Auto-generated from ZEFIX OpenAPI 3.1.0 specification
- Bundle size: ~12KB minified
- Runtime: Node.js 18+, Cloudflare Workers, Vercel/Netlify Edge
- No runtime dependencies (fully bundled)

[Unreleased]: https://github.com/TenderLift/zefix-client/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/TenderLift/zefix-client/releases/tag/v0.1.0
