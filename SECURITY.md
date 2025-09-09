# Security Policy

## Reporting a Vulnerability

We take the security of our software seriously. If you believe you have found a security vulnerability in @tenderlift/zefix-client, please report it to us as described below.

### Please do NOT:
- Open a public GitHub issue for security vulnerabilities
- Disclose the vulnerability publicly before a fix is available

### Please DO:
- Email us at: security@tenderlift.ch
- Include the following information:
  - Type of vulnerability (e.g., credential exposure, injection, etc.)
  - Full paths of source file(s) related to the vulnerability
  - Step-by-step instructions to reproduce the issue
  - Proof-of-concept or exploit code (if possible)
  - Impact assessment

### What to Expect

- **Acknowledgment**: We will acknowledge receipt of your vulnerability report within 48 hours
- **Assessment**: We will investigate and validate the reported vulnerability
- **Fix Timeline**: We aim to release a fix within 7-14 days, depending on severity
- **Disclosure**: We will coordinate public disclosure with you after the fix is released
- **Credit**: We will credit you for the discovery (unless you prefer to remain anonymous)

## Security Best Practices for Users

### Credential Management
- **Never** commit ZEFIX credentials to version control
- Use environment variables or secure secret management systems
- Rotate credentials regularly
- Use separate credentials for development and production

### Environment Setup
```bash
# Good: Use environment variables
export ZEFIX_USERNAME="your-username"
export ZEFIX_PASSWORD="your-password"

# Bad: Hardcoding credentials
const client = configureClient({
  auth: {
    username: "hardcoded-username",  // Never do this!
    password: "hardcoded-password"   // Never do this!
  }
});
```

### Cloudflare Workers
Store credentials securely in Worker secrets:
```bash
wrangler secret put ZEFIX_USERNAME
wrangler secret put ZEFIX_PASSWORD
```

### Server-Side Only
This client is designed for server-side use only. The ZEFIX API does not support CORS, making it unsuitable for direct browser usage. Always use this client from:
- Node.js backends
- Cloudflare Workers
- Edge functions (Vercel, Netlify)
- Other server environments

### Rate Limiting
Respect ZEFIX API rate limits to avoid service disruption:
```typescript
configureClient({
  auth: { /* ... */ },
  throttle: {
    minIntervalMs: 1000  // Minimum 1 second between requests
  }
});
```

## Security Features

### Built-in Protections
- Browser environment detection prevents accidental client-side usage
- HTTP Basic Auth credentials are properly encoded
- No credentials are logged or exposed in error messages
- All dependencies are bundled (no supply chain risks)
- TypeScript strict mode enabled

### Dependencies
This package has zero runtime dependencies, minimizing supply chain attack vectors. All code is bundled at build time.

## Vulnerability Disclosure Policy

We follow responsible disclosure practices:

1. Security issues are fixed in private
2. A security advisory is published after the fix is released
3. Credits are given to reporters (with permission)
4. We maintain a SECURITY.md file with current practices

## Contact

For security concerns, contact: security@tenderlift.ch

For general issues, use: https://github.com/TenderLift/zefix-client/issues