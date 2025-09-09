const fs = require('fs');
const path = require('path');

// Check for expected operationIds in the spec
const specPath = process.env.OAS_PATH || '/tmp/zefix-openapi.json';

// If we're using the default URL, we don't have a local file to validate
// Just check that the generated files exist
if (!process.env.OAS_PATH) {
  console.log('✓ Using default OpenAPI spec URL, checking generated files...');

  const requiredFiles = [
    'src/generated/client.gen.ts',
    'src/generated/sdk.gen.ts',
    'src/generated/types.gen.ts',
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, '..', file);
    if (!fs.existsSync(filePath)) {
      console.error(`ERROR: Required file missing: ${file}`);
      process.exit(1);
    }
  }

  // Check that we have some expected functions in the SDK
  const sdkPath = path.join(__dirname, '../src/generated/sdk.gen.ts');
  const sdkContent = fs.readFileSync(sdkPath, 'utf8');

  // Check for key function patterns (these are likely to exist based on standard ZEFIX operations)
  const expectedPatterns = [
    /export\s+(const|function)\s+search/, // Search function
    /export\s+(const|function)\s+showUid/, // UID lookup function
    /export\s+(const|function)\s+showChid/, // CH-ID lookup function
    /export\s+(const|function)\s+get/, // Get function
  ];

  const missingPatterns = expectedPatterns.filter((pattern) => !pattern.test(sdkContent));

  if (missingPatterns.length > 0) {
    console.error('ERROR: Generated SDK seems incomplete. Missing expected patterns.');
    console.error('Expected to find company, UID, and search related functions.');
    process.exit(1);
  }

  console.log('✓ All required files generated successfully');
  console.log('✓ Generated SDK contains expected operations');
  process.exit(0);
}

// If we have a local spec file, validate it properly
if (!fs.existsSync(specPath)) {
  console.error(`ERROR: OpenAPI spec file not found at ${specPath}`);
  process.exit(1);
}

const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));

// Define critical operations we depend on (based on actual ZEFIX API)
const requiredOperations = [
  'search', // Company search
  'showUID', // UID lookup
  'showCHID', // CH-ID lookup
  'get', // Get company details
];

// Extract all operationIds from spec
const operationIds = new Set();
for (const path of Object.values(spec.paths || {})) {
  for (const method of Object.values(path)) {
    if (method.operationId) {
      operationIds.add(method.operationId);
    }
  }
}

// Verify required operations exist
const missing = requiredOperations.filter((op) => !operationIds.has(op));
if (missing.length > 0) {
  console.error(`ERROR: Missing required operations: ${missing.join(', ')}`);
  console.error(`Available operations: ${Array.from(operationIds).join(', ')}`);
  process.exit(1);
}

console.log('✓ All required operations found in OpenAPI spec');
