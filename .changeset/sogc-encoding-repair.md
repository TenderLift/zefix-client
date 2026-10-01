---
"@tenderlift/zefix-client": minor
---

Repair the double-encoded UTF-8 ZEFIX serves in SOGC notice text (`ZÃ¼rich` → `Zürich`).

Since 2026-03-16 the PublicREST API returns `sogcPublication.message` (and `sogcPub[].message`) double-encoded on most publication days. `getSogcByDate`, `getSogcPublications` and the three `getCompanyBy*` functions now repair that field by default; the repair accepts only plausible double-encodings, so correct text (`«CAFÉ»`, `„Fuß“`) is unchanged and a second pass is a no-op. A caller's `responseTransformer` runs after it. Opt out process-wide with `configureClient({repairEncoding: false})`. Exported as `fixDoubleEncodedUtf8` / `looksDoubleEncoded` / `repairSogcMessages`, also from the dependency-free `@tenderlift/zefix-client/text` subpath.
