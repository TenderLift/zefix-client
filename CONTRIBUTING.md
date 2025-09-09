# Contributing to @tenderlift/zefix-client

Thank you for your interest in contributing to the ZEFIX API client!

## Development Setup

1. **Prerequisites**
   - Node.js >= 20
   - pnpm 10.14.0 (`corepack enable && corepack prepare pnpm@10.14.0 --activate`)

2. **Clone and Install**
   ```bash
   git clone https://github.com/TenderLift/zefix-client.git
   cd zefix-client
   pnpm install
   ```

3. **Environment Setup**
   Create a `.env` file with your ZEFIX credentials:
   ```env
   ZEFIX_USERNAME=your-username
   ZEFIX_PASSWORD=your-password
   ```

## Development Workflow

### Running Tests
```bash
# Run all tests
pnpm test

# Run specific test suites
pnpm test:node     # Node.js environment tests
pnpm test:workers  # Cloudflare Workers tests
pnpm test:e2e      # End-to-end tests (requires credentials)

# Watch mode for development
pnpm test:watch
```

### Code Quality
```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint
pnpm lint:fix  # Auto-fix issues

# Bundle size analysis
pnpm size
pnpm analyze
```

### Building
```bash
pnpm build  # Build the package
```

## Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write code following existing patterns
   - Add tests for new functionality
   - Update documentation if needed

3. **Commit your changes**
   - We use conventional commits format
   - Run `pnpm test` and `pnpm lint` before committing
   - Git hooks will automatically run checks

4. **Push and create a Pull Request**
   - Push your branch to GitHub
   - Create a PR with a clear description
   - Link any related issues

## Code Guidelines

### TypeScript
- Use strict TypeScript settings
- Prefer interfaces over types for object shapes
- Export types alongside implementations
- Avoid `any` - use `unknown` if type is truly unknown

### Testing
- Write tests for all new functionality
- Test both success and error cases
- Use MSW for API mocking in tests
- Keep E2E tests minimal (they hit real API)

### API Client Conventions
- Keep the client zero-dependency
- Ensure Cloudflare Workers compatibility
- Follow the existing error handling patterns
- Maintain backward compatibility

## Regenerating the Client

The client is auto-generated from the ZEFIX OpenAPI spec:

```bash
# Fetch latest spec and regenerate
pnpm gen

# Verify no manual changes were lost
git diff src/generated/
```

⚠️ **Important**: Never manually edit files in `src/generated/`

## Testing Against Real API

E2E tests require valid ZEFIX credentials:

```bash
# Run E2E tests (uses .env credentials)
pnpm test:e2e
```

Be mindful of rate limits (1 request/second recommended).

## Reporting Issues

- Check existing issues first
- Provide minimal reproduction code
- Include error messages and stack traces
- Specify Node.js version and environment

## Questions?

Open a discussion on GitHub or reach out to the maintainers.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.