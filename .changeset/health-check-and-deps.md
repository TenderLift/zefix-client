---
"@tenderlift/zefix-client": patch
---

Fix broken type guards and update all dependencies

- Fix `isLegalForm` type guard: `LegalForm.name` is `DfieString` (object), not a string
- Fix `isBfsCommunity` type guard: field is `name`, not `communityName`
- Add missing `size-limit` configuration for bundle size tracking
- Update ZEFIX OpenAPI spec to v2.7.2.3 (no breaking changes)
- Bump all devDependencies: TypeScript 6, Vitest 4, Cloudflare pool-workers 0.15, openapi-ts 0.97
- Migrate worker test config to new Cloudflare Vitest plugin API
- Reduce security vulnerabilities from 10+ to 6 (all dev-only, 0 critical)
