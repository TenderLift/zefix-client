const fs = require('fs');
const path = require('path');

// Load package.json
const pkgPath = path.join(__dirname, '../package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

// Ensure zero runtime dependencies
if (pkg.dependencies && Object.keys(pkg.dependencies).length > 0) {
  console.error('❌ ERROR: Package has runtime dependencies:', pkg.dependencies);
  console.error('This package must have zero runtime dependencies for edge compatibility.');
  process.exit(1);
}

console.log('✓ Zero runtime dependencies verified');

// Check bundle size (warn if >50KB, fail if >80KB)
const distFiles = [
  path.join(__dirname, '../dist/index.js'),
  path.join(__dirname, '../dist/index.cjs'),
];

let maxSize = 0;
let largestFile = '';

for (const filePath of distFiles) {
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const sizeKB = stats.size / 1024;
    console.log(`  ${path.basename(filePath)}: ${sizeKB.toFixed(2)}KB`);

    if (sizeKB > maxSize) {
      maxSize = sizeKB;
      largestFile = path.basename(filePath);
    }
  }
}

if (maxSize > 80) {
  console.error(
    `❌ ERROR: Bundle size ${maxSize.toFixed(2)}KB exceeds 80KB limit (${largestFile})`,
  );
  process.exit(1);
} else if (maxSize > 50) {
  console.warn(
    `⚠️  WARNING: Bundle size ${maxSize.toFixed(2)}KB exceeds 50KB target (${largestFile})`,
  );
} else {
  console.log(`✓ Bundle size: ${maxSize.toFixed(2)}KB (excellent!)`);
}

// Check that exports are properly configured
const requiredFiles = ['dist/index.js', 'dist/index.cjs'];
const missingFiles = requiredFiles.filter(
  (file) => !fs.existsSync(path.join(__dirname, '..', file)),
);

if (missingFiles.length > 0) {
  console.error('❌ ERROR: Missing required distribution files:', missingFiles);
  process.exit(1);
}

console.log('✓ All distribution files present');
console.log('✅ Bundle verification complete!');
