---
'@tenderlift/zefix-client': patch
---

Fix dual-package hazard causing silent `401 Unauthorized`.

The package ships both ESM (`dist/index.js`) and CJS (`dist/index.cjs`) builds, each
bundling its own copy of the generated client. A process that loaded both variants —
e.g. a CommonJS entrypoint that statically imports the client alongside an ESM
dependency that dynamically imports it — got two independent client instances with
separate config + interceptor chains. `configureClient()` against one was invisible to
SDK calls resolved through the other, surfacing as `searchCompanies` returning 401 while
`getCompanyByUid` (resolved through the configured instance) worked in the same process.

The client is now pinned on `globalThis` (keyed by `Symbol.for`) so every loaded bundle
variant shares a single config + auth interceptor chain. Public API is unchanged.
