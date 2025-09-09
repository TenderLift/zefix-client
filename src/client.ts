import { client } from './generated/client.gen';
import type { Config as GeneratedClientConfig } from './generated/client/types.gen';
import { toBase64 } from './utils/node-or-worker';
import {
  getCantons as getCantonsSdk,
  getCompanyByChid as getCompanyByChidSdk,
  getCompanyByEhraid as getCompanyByEhraidSdk,
  getCompanyByUid as getCompanyByUidSdk,
  getLegalForms as getLegalFormsSdk,
  getSogcByDate as getSogcByDateSdk,
  getSogcPublications as getSogcPublicationsSdk,
  searchCompanies as searchCompaniesSdk,
} from './generated/sdk.gen';

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

export class ZefixApiClient {
  private lastRequestTime = 0;

  constructor(private config: ClientConfig = {}) {
    // Browser environment guard
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      throw new Error(
        'ZEFIX API Client Error: This client is for server-side use only (Node.js, Cloudflare Workers). ' +
          'It cannot be used in browsers due to CORS restrictions on the ZEFIX API. ' +
          'Please make API calls from your backend server.',
      );
    }

    const clientConfig: Partial<GeneratedClientConfig> = {
      baseUrl: config.baseUrl ?? 'https://www.zefix.admin.ch/ZefixPublicREST',
    };
    if (config.customFetch) {
      clientConfig.fetch = config.customFetch;
    }

    client.setConfig(clientConfig);

    client.interceptors.request.use(async (req: Request) => {
      const headers = new Headers(req.headers);

      if (this.config.auth?.username && this.config.auth?.password) {
        const credentials = toBase64(`${this.config.auth.username}:${this.config.auth.password}`);
        headers.set('Authorization', `Basic ${credentials}`);
      }

      if (this.config.throttle?.minIntervalMs && this.config.throttle.minIntervalMs > 0) {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        const minInterval = this.config.throttle.minIntervalMs;
        if (timeSinceLastRequest < minInterval) {
          await new Promise((resolve) => setTimeout(resolve, minInterval - timeSinceLastRequest));
        }
        this.lastRequestTime = Date.now();
      }

      return new Request(req, { headers });
    });
  }

  public setAuth(auth: Auth | undefined) {
    this.config.auth = auth;
  }

  public getCantons = getCantonsSdk;
  public getCompanyByChid = getCompanyByChidSdk;
  public getCompanyByEhraid = getCompanyByEhraidSdk;
  public getCompanyByUid = getCompanyByUidSdk;
  public getLegalForms = getLegalFormsSdk;
  public getSogcByDate = getSogcByDateSdk;
  public getSogcPublications = getSogcPublicationsSdk;
  public searchCompanies = searchCompaniesSdk;
}
