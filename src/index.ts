// Re-export generated client and types
export { client } from './generated/client.gen';
export * from './generated/sdk.gen';
export type * from './generated/types.gen';

// Import utilities
import { client } from './generated/client.gen';
import type { Config as GeneratedClientConfig } from './generated/client/types.gen';
import { toBase64 } from './utils/node-or-worker';

// Export utilities
export { toBase64 } from './utils/node-or-worker';
export * from './utils/type-guards';

// Types
export type Auth = {
  username?: string;
  password?: string;
};

export type ClientConfig = {
  baseUrl?: string;
  auth?: Auth;
  throttle?: { minIntervalMs?: number };
  customFetch?: typeof fetch;
};

// State management
let lastRequestTime = 0;
let currentAuth: Auth | undefined;
let throttleConfig: { minIntervalMs?: number } | undefined;

/**
 * Configure the ZEFIX API client
 * @throws Error if used in a browser environment (CORS restrictions)
 */
export const configureClient = (config: ClientConfig = {}) => {
  // Browser environment guard
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    throw new Error(
      'ZEFIX API Client Error: This client is for server-side use only (Node.js, Cloudflare Workers). ' +
        'It cannot be used in browsers due to CORS restrictions on the ZEFIX API. ' +
        'Please make API calls from your backend server.',
    );
  }

  const {
    baseUrl = 'https://www.zefix.admin.ch/ZefixPublicREST',
    auth,
    throttle,
    customFetch,
  } = config;

  currentAuth = auth;
  throttleConfig = throttle;

  // Configure the client with base URL and custom fetch if provided
  const clientConfig: Partial<GeneratedClientConfig> = { baseUrl };
  if (customFetch) {
    clientConfig.fetch = customFetch;
  }

  client.setConfig(clientConfig);

  // Add request interceptor for auth and throttling
  client.interceptors.request.use(async (req: Request) => {
    // Clone headers so we can mutate them
    const headers = new Headers(req.headers);

    // Apply auth if configured
    if (currentAuth?.username && currentAuth?.password) {
      const credentials = toBase64(`${currentAuth.username}:${currentAuth.password}`);
      headers.set('Authorization', `Basic ${credentials}`);
    }

    // Apply throttling if configured
    if (throttleConfig?.minIntervalMs && throttleConfig.minIntervalMs > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;
      const minInterval = throttleConfig.minIntervalMs;
      if (timeSinceLastRequest < minInterval) {
        await new Promise((resolve) => setTimeout(resolve, minInterval - timeSinceLastRequest));
      }
      lastRequestTime = Date.now();
    }

    // Return a new Request with updated headers
    return new Request(req, { headers });
  });
};

/**
 * Update authentication without reconfiguring the entire client
 */
export const setAuth = (auth: Auth | undefined) => {
  currentAuth = auth;
  configureClient({ auth });
};

/**
 * Error class for ZEFIX API errors with auth redaction
 */
export class ZefixError extends Error {
  constructor(
    public status: number,
    public code?: string,
    message?: string,
    public body?: unknown,
  ) {
    super(message || `HTTP ${status}`);
    this.name = 'ZefixError';

    // Never log auth headers
    if (this.body && typeof this.body === 'object' && 'headers' in this.body) {
      const redacted = { ...this.body };
      if ('headers' in redacted && typeof redacted.headers === 'object') {
        const headers = { ...(redacted.headers as Record<string, string>) };
        if ('Authorization' in headers) {
          headers.Authorization = '[REDACTED]';
        }
        if ('authorization' in headers) {
          headers.authorization = '[REDACTED]';
        }
        redacted.headers = headers;
      }
      this.body = redacted;
    }
  }
}

/**
 * Ensure response is OK, throw ZefixError if not
 */
export async function ensureOk<T>(res: { response: Response; data?: T }): Promise<T> {
  if (!res.response.ok) {
    throw new ZefixError(
      res.response.status,
      undefined,
      `Request failed with status ${res.response.status}`,
      res.data,
    );
  }
  if (!res.data) {
    throw new ZefixError(res.response.status, 'NO_DATA', 'Response contained no data', undefined);
  }
  return res.data;
}

// Curated high-value exports with better names
export {
  list1 as getCantons,
  showChid as getCompanyByChid,
  showEhraid as getCompanyByEhraid,
  showUid as getCompanyByUid,
  list as getLegalForms,
  byDate as getSogcByDate,
  get as getSogcPublications,
  search as searchCompanies,
} from './generated/sdk.gen';
