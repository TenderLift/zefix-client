---
"@tenderlift/zefix-client": minor
---

Repair the double-encoded UTF-8 ZEFIX serves in SOGC notice text (`ZÃ¼rich` → `Zürich`).

Since 2026-03-16 the PublicREST API returns `sogcPublication.message` (and `sogcPub[].message`) double-encoded on most publication days. Every SDK function now repairs response strings by default — selective and idempotent, so clean text is unchanged. Opt out with `configureClient({repairEncoding: false})`. The repair is exported as `fixDoubleEncodedUtf8` / `looksDoubleEncoded` / `repairStringsDeep`, also from the dependency-free `@tenderlift/zefix-client/text` subpath.
