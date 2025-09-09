import { defineConfig } from '@hey-api/openapi-ts';

const input = process.env.OAS_PATH ?? 'https://www.zefix.admin.ch/ZefixPublicREST/v3/api-docs';

export default defineConfig({
  input,
  output: {
    path: 'src/generated',
    indexFile: false,
  },
  plugins: [
    {
      name: '@hey-api/client-fetch',
      // Don't rely on 'baseUrl' - we'll configure it post-generation
    },
  ],
});
