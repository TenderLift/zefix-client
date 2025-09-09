# Zefix API Client Implementation Plan

This document outlines the mandatory tasks to bring the `zefix-client` to the same production-level quality as the `simap-client`.

## Stage 1: Foundational Setup

- [x] Initialize a new git repository and push to GitHub.
- [x] Review and update `package.json` for a standalone package.
  - [x] Update `name`, `version`, `description`, `author`, `license`, etc.
  - [x] Add `repository`, `bugs`, and `homepage` fields.
  - [x] Clean up scripts and dependencies.
- [x] Create a comprehensive `README.md` for the standalone repository.
- [x] Add standard documentation files:
  - [x] `CHANGELOG.md`
  - [x] `CODE_OF_CONDUCT.md` (skipped)
  - [x] `CONTRIBUTING.md`
  - [x] `LICENSE`
  - [x] `NOTICE`
  - [x] `SECURITY.md`

## Stage 2: Tooling and Configuration

- [x] Set up `lefthook` for pre-commit hooks (`lefthook.yml`).
- [x] Configure `codecov` for test coverage reporting (`codecov.yml`).
- [x] Configure `openapi-ts` for OpenAPI schema generation (`openapi-ts.config.ts`).
- [x] Configure `tsup` for bundling (`tsup.config.ts`).
- [x] Configure `vitest` for testing (`vitest.config.node.ts`, `vitest.config.ts`).
- [x] Configure `xo` for linting (`xo.config.js`).
- [x] Set up GitHub Actions for CI/CD (`.github/workflows/`).
  - [x] PR checks (linting, testing, building).
  - [x] Release workflow.

## Stage 3: Code and Tests

- [x] Add `examples/` directory with usage examples.
- [x] Add `test/` directory with comprehensive tests.
- [x] Add `spec/` directory for API specifications.
- [x] Review and refactor the existing code to be a standalone library.
- [x] Ensure all dependencies are correctly listed in `package.json`.

## Stage 4: Finalization

- [x] Perform a final review of all files and configurations.
- [ ] Publish the package to a package manager (e.g., npm).
- [ ] Create the first release on GitHub.

## Next Steps (Granular)

1.  **Complete `package.json`:**
    - [x] Set `name` to `@tenderlift/zefix-client`.
    - [x] Set `version` to `0.1.0`.
    - [x] Set `private` to `false`.
    - [x] Add `publishConfig` with `access: public`.
2.  **Add Legal Documents:**
    - [x] Create `LICENSE` file (MIT).
    - [x] Create `NOTICE` file.
    - [ ] Create `CODE_OF_CONDUCT.md` (skipped).
    - [x] Create `CONTRIBUTING.md`.
    - [x] Create `SECURITY.md`.
3.  **Set up Linting and Formatting:**
    - [x] Install `lefthook` and `xo`.
    - [x] Configure `xo` in `xo.config.js`.
    - [x] Configure `lefthook` in `lefthook.yml` to run `xo` on pre-commit.
4.  **Create `README.md`:**
    - [x] Add badges for build status, coverage, etc.
    - [x] Add installation instructions.
    - [x] Add usage examples.
    - [x] Add API documentation.
5.  **Add Examples:**
    - [x] Create `examples/basic-usage.ts`.
    - [x] Create `examples/cloudflare-worker.ts`.
6.  **Set up CI/CD:**
    - [x] Create `.github/workflows/ci.yml` to run linting, testing, and building on PRs.
    - [x] Create `.github/workflows/release.yml` to publish to npm on new releases.

## Key Requirements

- **Edge-First**: Must run on Cloudflare Workers (no Node.js dependencies)
- **Zero Runtime Dependencies**: Bundle everything including `@hey-api/client-fetch`
- **Automated Maintenance**: Daily regeneration via GitHub Actions with hash-based change detection
- **Type-Safe**: Full TypeScript support with generated types
- **Dual Testing**: Workers runtime tests + Node.js compatibility tests
- **NPM Ready**: Prepared for publishing as `@tenderlift/zefix-client`
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
