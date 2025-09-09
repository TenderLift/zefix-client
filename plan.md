# Zefix API Client Implementation Plan

This document outlines the mandatory tasks to bring the `zefix-api-client` to the same production-level quality as the `simap-client`.

## Stage 1: Foundational Setup

- [x] Initialize a new git repository and push to GitHub.
- [x] Review and update `package.json` for a standalone package.
  - [ ] Update `name`, `version`, `description`, `author`, `license`, etc.
  - [ ] Add `repository`, `bugs`, and `homepage` fields.
  - [x] Clean up scripts and dependencies.
- [ ] Create a comprehensive `README.md` for the standalone repository.
- [ ] Add standard documentation files:
  - [ ] `CHANGELOG.md`
  - [ ] `CODE_OF_CONDUCT.md`
  - [ ] `CONTRIBUTING.md`
  - [ ] `LICENSE`
  - [ ] `NOTICE`
  - [ ] `SECURITY.md`

## Stage 2: Tooling and Configuration

- [ ] Set up `lefthook` for pre-commit hooks (`lefthook.yml`).
- [ ] Configure `codecov` for test coverage reporting (`codecov.yml`).
- [x] Configure `openapi-ts` for OpenAPI schema generation (`openapi-ts.config.ts`).
- [x] Configure `tsup` for bundling (`tsup.config.ts`).
- [x] Configure `vitest` for testing (`vitest.config.node.ts`, `vitest.config.ts`).
- [ ] Configure `xo` for linting (`xo.config.js`).
- [ ] Set up GitHub Actions for CI/CD (`.github/workflows/`).
  - [ ] PR checks (linting, testing, building).
  - [ ] Release workflow.

## Stage 3: Code and Tests

- [ ] Add `examples/` directory with usage examples.
- [ ] Add `test/` directory with comprehensive tests.
- [ ] Add `spec/` directory for API specifications.
- [ ] Review and refactor the existing code to be a standalone library.
- [ ] Ensure all dependencies are correctly listed in `package.json`.

## Stage 4: Finalization

- [ ] Perform a final review of all files and configurations.
- [ ] Publish the package to a package manager (e.g., npm).
- [ ] Create the first release on GitHub.

## Key Requirements

- **Edge-First**: Must run on Cloudflare Workers (no Node.js dependencies)
- **Zero Runtime Dependencies**: Bundle everything including `@hey-api/client-fetch`
- **Automated Maintenance**: Daily regeneration via GitHub Actions with hash-based change detection
- **Type-Safe**: Full TypeScript support with generated types
- **Dual Testing**: Workers runtime tests + Node.js compatibility tests
- **NPM Ready**: Prepared for publishing as `@tenderlift/zefix-api-client`
- **CORS-Aware**: Server-side only (Workers), not for browser usage

## API Differences from SIMAP

| Aspect          | SIMAP                      | ZEFIX                                      |
| --------------- | -------------------------- | ------------------------------------------ |
| Authentication  | Bearer Token               | HTTP Basic Auth                            |
| OpenAPI Version | 3.0.x                      | 3.1.0                                      |
| Base URL        | https://www.simap.ch/api   | https://www.zefix.admin.ch/ZefixPublicREST |
| Spec URL        | /specifications/simap.yaml | /v3/api-docs (JSON)                        |
| Main Operations | Tender listings            | Company search/lookup                      |
| Rate Limiting   | Not specified              | 1 req/sec recommended                      |
| CORS Support    | No                         | No (server-side only)                      |
