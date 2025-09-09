# @tenderlift/zefix-client

[![npm version](https://img.shields.io/npm/v/@tenderlift/zefix-client.svg)](https://www.npmjs.com/package/@tenderlift/zefix-client)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@tenderlift/zefix-client)](https://bundlephobia.com/package/@tenderlift/zefix-client)

TypeScript client for the ZEFIX (Swiss Business Registry) API, auto-generated from [the official OpenAPI specification](https://www.zefix.admin.ch/ZefixPublicREST/v3/api-docs).

> ⚠️ **Non-affiliation Notice**: This is an unofficial, open-source library for the ZEFIX API. It is developed and maintained independently by TenderLift and is not affiliated with, endorsed by, or connected to ZEFIX or the Swiss Federal Commercial Registry Office. For official information, visit [zefix.ch](https://www.zefix.ch).

## Features

- **Full TypeScript support** with comprehensive type definitions
- **Multi-runtime compatible**: Node.js 20+, Cloudflare Workers, Vercel/Netlify Edge
- **Lightweight**: <12KB minified with zero runtime dependencies
- **Auto-generated** from official ZEFIX OpenAPI specification
- **Built-in error handling** with typed error responses
- **Authentication helpers** for HTTP Basic Auth
- **Rate limiting support** with configurable throttling
- **Multi-language support** (DE, FR, IT, EN)

## Installation

```bash
npm install @tenderlift/zefix-client
# or
pnpm add @tenderlift/zefix-client
# or
yarn add @tenderlift/zefix-client
```

## Quick Start

### Basic Usage (Node.js/Edge)

```typescript
import {
  configureClient,
  searchCompanies,
  getCompanyByUid,
  ensureOk,
  ZefixError
} from '@tenderlift/zefix-client';

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
    canton: 'ZH',
  },
});

const companies = await ensureOk(searchResult);
console.log(`Found ${companies.length} companies`);

// Get company details
const companyResult = await getCompanyByUid({
  path: { id: 'CHE-105.815.381' },
});

const companyDetails = await ensureOk(companyResult);
console.log(companyDetails[0]?.name);
```

### Error Handling

```typescript
import { ensureOk, ZefixError } from '@tenderlift/zefix-client';

try {
  const result = await getCompanyByUid({
    path: { id: 'CHE-123.456.789' },
  });
  const company = await ensureOk(result);
  console.log(company);
} catch (error) {
  if (error instanceof ZefixError) {
    console.error(`ZEFIX Error ${error.status}: ${error.message}`);
    if (error.status === 404) {
      console.log('Company not found');
    }
  }
}
```

## Browser Support

❌ **Direct browser usage is not supported** because the ZEFIX API does not send CORS headers.

If you need to use this client in a browser application, you must:
1. Set up a proxy server (your backend, edge function, or development server)
2. Route ZEFIX API requests through your proxy
3. Configure the client to use your proxy URL

Example proxy setup with Vite:
```javascript
// vite.config.js
export default {
  server: {
    proxy: {
      '/api/zefix': {
        target: 'https://www.zefix.admin.ch',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/zefix/, '/ZefixPublicREST/api/v1'),
      }
    }
  }
}
```

## API Documentation

### Available Endpoints

#### Company Operations
- `searchCompanies(options)` - Search for companies
- `getCompanyByUid(options)` - Get company details by UID
- `getCompanyByCHID(options)` - Get company by CHID
- `getCompanyByEHRAID(options)` - Get company by EHRAID

#### Reference Data
- `getLegalForms(options)` - Get legal forms
- `getCommunities(options)` - Get Swiss communities (formerly cantons)
- `getRegistryOffices(options)` - Get registry offices
- `getRegistryByBfsCommunityId(options)` - Get registry by BFS ID

#### SOGC Publications
- `getSogcPublications(options)` - Get Swiss Official Gazette of Commerce publications
- `getSogcByDate(options)` - Get SOGC publications by date

### Utility Functions

```typescript
// Validation utilities
import { isValidUid, formatUid } from '@tenderlift/zefix-client';

console.log(isValidUid('CHE-105.815.381')); // true
console.log(formatUid('CHE105815381')); // 'CHE-105.815.381'

// Type guards
import { isCompany, isActiveCompany } from '@tenderlift/zefix-client';

if (isCompany(data) && isActiveCompany(data)) {
  console.log(`${data.name} is an active company`);
}
```

### Language Support

ZEFIX API supports multiple languages (de, fr, it, en):

```typescript
// Get company info in different languages
const germanResult = await getCompanyByUid({
  path: { id: 'CHE-105.815.381' },
  query: { languageKey: 'de' },
});

const frenchResult = await getCompanyByUid({
  path: { id: 'CHE-105.815.381' },
  query: { languageKey: 'fr' },
});

// Get language-specific reference data
const legalForms = await getLegalForms({ query: { languageKey: 'it' } });
```

### Rate Limiting

Configure automatic request throttling:

```typescript
configureClient({
  auth: {
    username: process.env.ZEFIX_USERNAME,
    password: process.env.ZEFIX_PASSWORD,
  },
  throttle: {
    minIntervalMs: 1000, // Minimum 1 second between requests
  },
});

// Requests will be automatically throttled
for (const uid of companyUids) {
  const result = await getCompanyByUid({ path: { id: uid } });
  // Automatically waits if needed
}
```

## Cloudflare Workers Example

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    configureClient({
      auth: {
        username: env.ZEFIX_USERNAME,
        password: env.ZEFIX_PASSWORD,
      },
    });

    const url = new URL(request.url);
    const uid = url.searchParams.get('uid');

    if (!uid) {
      return new Response('Missing UID parameter', { status: 400 });
    }

    try {
      const result = await getCompanyByUid({ path: { id: uid } });
      const company = await ensureOk(result);
      
      return new Response(JSON.stringify(company), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      if (error instanceof ZefixError && error.status === 404) {
        return new Response('Company not found', { status: 404 });
      }
      return new Response('Internal error', { status: 500 });
    }
  },
};
```

## Compatibility Matrix

- Node.js 20+: ✅
- Cloudflare Workers: ✅
- Vercel/Netlify Edge: ✅
- Deno: ✅ (with npm: imports)
- Browsers: ❌ (CORS blocked, use a backend proxy)

## Bundle Size

- **11.88KB minified** - Fully bundled with zero runtime dependencies
- Tree-shakeable exports for optimal bundle size
- Edge-optimized for Cloudflare Workers

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

### Scripts

- `pnpm build` - Build the library
- `pnpm test` - Run all tests
- `pnpm typecheck` - Type checking
- `pnpm lint` - Run linter
- `pnpm size` - Check bundle size

## Troubleshooting

### Common Issues

#### Authentication Failed
Ensure your ZEFIX credentials are valid. Contact ZEFIX for API access: [zefix@bj.admin.ch](mailto:zefix@bj.admin.ch)

#### Rate Limiting
ZEFIX API has rate limits. Use the `throttle` configuration to automatically handle rate limiting.

#### CORS Errors in Browser
The ZEFIX API does not support CORS. Use a backend proxy or edge function to make API calls.

## License

MIT © [TenderLift](https://github.com/tenderlift)

See [LICENSE](LICENSE) file for details.

## Links

- [NPM Package](https://www.npmjs.com/package/@tenderlift/zefix-client)
- [GitHub Repository](https://github.com/tenderlift/zefix-client)
- [Issue Tracker](https://github.com/tenderlift/zefix-client/issues)
- [ZEFIX Portal](https://www.zefix.ch)
- [ZEFIX API Documentation](https://www.zefix.admin.ch/ZefixPublicREST/swagger-ui/index.html)

---

Built with ❤️ for the Swiss open-source community