# @tenderlift/zefix-api-client

TypeScript client for the ZEFIX (Swiss Business Registry) API, auto-generated from [the official OpenAPI specification](https://www.zefix.admin.ch/ZefixPublicREST/v3/api-docs).

## Installation

```bash
npm install @tenderlift/zefix-api-client
# or
pnpm add @tenderlift/zefix-api-client
```

## What works (and what doesn't)

- ✅ **Server runtimes**: Node.js 18+, Cloudflare Workers, Vercel/Netlify Edge (Fetch API compatible)
- ✅ **Authentication**: HTTP Basic Auth support built-in
- ✅ **Zero dependencies**: Fully bundled (11.88KB), edge-ready

- ❌ **Direct browser usage**: **Not supported** due to CORS restrictions on the ZEFIX API

> If you want to call the API from a browser app, you **must** route requests through your own backend/proxy. This package is designed for server-side use only.

### Why

ZEFIX's API does not include `Access-Control-Allow-Origin` headers, so browsers block cross-origin requests. Server/edge environments are unaffected.

## Quick start (server/edge)

```typescript
import {
  configureClient,
  searchCompanies,
  getCompanyByUid,
  ensureOk,
} from '@tenderlift/zefix-api-client';

// Configure with your ZEFIX credentials
configureClient({
  auth: {
    username: process.env.ZEFIX_USERNAME,
    password: process.env.ZEFIX_PASSWORD,
  },
  throttle: { minIntervalMs: 1000 }, // Respect rate limits
});

// Search for companies
const searchResult = await searchCompanies({
  body: {
    name: 'Migros*',
    activeOnly: true,
    maxEntries: 10,
  },
});

const companies = await ensureOk(searchResult);
console.log(`Found ${companies.length} companies`);

// Get company by UID
const companyResult = await getCompanyByUid({
  uid: 'CHE-105.815.381',
  languageKey: 'en',
});

const company = await ensureOk(companyResult);
console.log(company.name);
```

## Integration Notes

- Server-only: The official ZEFIX API does not send CORS headers; call it from server/edge and never directly from browsers.
- Throttling: Respect upstream limits using the built-in `throttle.minIntervalMs` configuration; cache stable responses to reduce calls.
- Typical use: Enrich companies discovered via LINDAS with legal status, registration, and purpose; avoid bulk calls unless necessary.

## Authentication

ZEFIX API requires HTTP Basic Authentication for all endpoints:

```typescript
// Set up authentication once
configureClient({
  auth: {
    username: 'your-username',
    password: 'your-password',
  },
});

// Update auth dynamically if needed
import { setAuth } from '@tenderlift/zefix-api-client';
setAuth({ username: 'new-user', password: 'new-pass' });
```

### Cloudflare Workers

Store credentials securely in Worker secrets:

```bash
wrangler secret put ZEFIX_USERNAME
wrangler secret put ZEFIX_PASSWORD
```

```typescript
export default {
  async fetch(request: Request, env: Env) {
    configureClient({
      auth: {
        username: env.ZEFIX_USERNAME,
        password: env.ZEFIX_PASSWORD,
      },
    });

    // Your API calls here
  },
};
```

## Error Handling

```typescript
import { ZefixError, ensureOk } from '@tenderlift/zefix-api-client';

try {
  const result = await getCompanyByUid({ uid: 'CHE-123.456.789' });
  const company = await ensureOk(result);
  console.log(company.name);
} catch (error) {
  if (error instanceof ZefixError) {
    switch (error.status) {
      case 401:
        console.error('Invalid credentials');
        break;
      case 404:
        console.error('Company not found');
        break;
      case 429:
        console.error('Rate limit exceeded');
        break;
      default:
        console.error(`API Error ${error.status}: ${error.message}`);
    }
  }
}
```

## Type Guards & Helpers

```typescript
import {
  isCompany,
  isCompanyFull,
  isActiveCompany,
  isValidUid,
  formatUid,
  extractErrorMessage,
} from '@tenderlift/zefix-api-client';

// Validate UID format
if (isValidUid('CHE-123.456.789')) {
  // Valid Swiss UID format
}

// Format UID for display
const formatted = formatUid('CHE123456789'); // Returns: CHE-123.456.789

// Check if company is active
if (isActiveCompany(company)) {
  // Company status is ACTIVE
}

// Extract error messages safely
const message = extractErrorMessage(error);
```

## Rate Limiting

Respect ZEFIX API rate limits with built-in throttling:

```typescript
configureClient({
  auth: {
    /* ... */
  },
  throttle: {
    minIntervalMs: 1000, // Minimum 1 second between requests
  },
});

// Requests will be automatically throttled
for (const uid of companyUids) {
  const result = await getCompanyByUid({ uid });
  // Automatically waits if needed
}
```

## Language Support

ZEFIX API supports multiple languages (de, fr, it, en):

```typescript
// Get company info in different languages
const germanResult = await getCompanyByUid({
  uid: 'CHE-105.815.381',
  languageKey: 'de',
});

const frenchResult = await getCompanyByUid({
  uid: 'CHE-105.815.381',
  languageKey: 'fr',
});

// Get language-specific reference data
const legalForms = await getLegalForms({ languageKey: 'it' });
```

## Pagination

Handle large result sets with offset and limit:

```typescript
let offset = 0;
const limit = 50;
let hasMore = true;

while (hasMore) {
  const result = await searchCompanies({
    body: {
      name: 'Bank*',
      activeOnly: true,
      offset,
      maxEntries: limit,
    },
  });

  const companies = await ensureOk(result);

  // Process companies...

  hasMore = companies.length === limit;
  offset += limit;
}
```

## API Coverage

### Company Operations

- `searchCompanies()` - Search for companies by name, canton, status
- `getCompanyByUid()` - Get company details by UID
- `getCompanyByChid()` - Get company by CH-ID
- `getCompanyByEhraid()` - Get company by EHRA-ID

### Reference Data

- `getLegalForms()` - List all legal forms (AG, GmbH, etc.)
- `getCantons()` - List all Swiss communities/cantons
- `getSogcPublications()` - Get SOGC (Swiss Official Gazette) publications

## TypeScript

All request/response models are fully typed, generated from the ZEFIX OpenAPI schema:

```typescript
import type {
  CompanyShort,
  CompanyFull,
  LegalForm,
  BfsCommunity,
} from '@tenderlift/zefix-api-client';
```

## Runtime Protection

The client includes browser detection to prevent accidental browser usage:

```typescript
// This will throw an error in browser environments
configureClient({
  /* ... */
});
// Error: ZEFIX API Client Error: This client is for server-side use only...
```

## Compatibility Matrix

- Node.js 18+: ✅
- Cloudflare Workers: ✅
- Vercel/Netlify Edge: ✅
- Deno: ✅ (with npm: imports)
- Browsers: ❌ (CORS blocked, use a backend proxy)

## Bundle Size

- **11.88KB minified** - Fully bundled with zero runtime dependencies
- Tree-shakeable exports for optimal bundle size
- Edge-optimized for Cloudflare Workers

## Contributing

This is an auto-generated client. To report issues:

1. Check if the issue is with the ZEFIX API itself
2. For client generation issues, create an issue in this repository
3. For API issues, contact ZEFIX support

## Links

- [ZEFIX Portal](https://www.zefix.ch)
- [ZEFIX API Documentation](https://www.zefix.admin.ch/ZefixPublicREST/swagger-ui/index.html)
- [TenderLift](https://tenderlift.ch)

## License

MIT
