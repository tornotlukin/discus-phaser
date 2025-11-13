# Build & Packaging Scripts Guide

**Folder:** `scripts/`
**Purpose:** Build scripts, validation scripts, and automation

---

## Overview

This folder contains Node.js scripts for:
- Building client and server
- Validating configuration files
- Packaging Electron apps
- Automation and CI/CD tasks

## Key Principles

- **Node.js scripts** - Use JavaScript or TypeScript
- **Documented** - Clear comments and usage instructions
- **Error handling** - Graceful failure with helpful messages
- **Idempotent** - Safe to run multiple times

---

## Folder Structure

```
scripts/
├── build-client.js        # Client build script
├── build-server.js        # Server build script
├── build-all.js           # Build both client and server
├── validate-config.js     # Validate JSON configuration
├── package-electron.js    # Package Electron app
├── clean.js               # Clean build artifacts
└── utils/                 # Shared script utilities
    ├── logger.js          # Logging utilities
    └── file-utils.js      # File system utilities
```

---

## Configuration Validation Script

### validate-config.js

```javascript
const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');

/**
 * Validate configuration files against JSON Schema
 */
function validateConfig() {
  const ajv = new Ajv({ allErrors: true });

  // Load schema
  const schemaPath = path.join(__dirname, '../src/config/schemas/config.schema.json');
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

  // Compile validator
  const validate = ajv.compile(schema);

  // Config files to validate
  const configs = [
    { name: 'base.json', path: '../src/config/base.json' },
    { name: 'dev.json', path: '../src/config/dev.json' },
    { name: 'prod.json', path: '../src/config/prod.json' }
  ];

  let hasErrors = false;

  configs.forEach(({ name, path: configPath }) => {
    console.log(`\nValidating ${name}...`);

    try {
      const fullPath = path.join(__dirname, configPath);
      const config = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

      // Merge with base for env-specific configs
      let configToValidate = config;
      if (name !== 'base.json') {
        const basePath = path.join(__dirname, '../src/config/base.json');
        const baseConfig = JSON.parse(fs.readFileSync(basePath, 'utf8'));
        configToValidate = deepMerge(baseConfig, config);
      }

      const valid = validate(configToValidate);

      if (!valid) {
        console.error(`❌ ${name} validation failed:`);
        console.error(JSON.stringify(validate.errors, null, 2));
        hasErrors = true;
      } else {
        console.log(`✓ ${name} is valid`);
      }
    } catch (error) {
      console.error(`❌ Error reading ${name}:`, error.message);
      hasErrors = true;
    }
  });

  if (hasErrors) {
    console.error('\n❌ Configuration validation failed');
    process.exit(1);
  } else {
    console.log('\n✓ All configurations are valid');
  }
}

/**
 * Deep merge two objects
 */
function deepMerge(target, source) {
  const result = { ...target };

  for (const key in source) {
    if (source[key] instanceof Object && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

// Run validation
validateConfig();
```

### Usage

```bash
npm run validate:config
```

Add to `package.json`:

```json
{
  "scripts": {
    "validate:config": "node scripts/validate-config.js"
  }
}
```

---

## Build Scripts

### build-client.js

```javascript
const { build } = require('vite');
const path = require('path');

/**
 * Build client code with Vite
 */
async function buildClient() {
  console.log('Building client...\n');

  try {
    await build({
      root: path.join(__dirname, '..'),
      build: {
        outDir: 'dist/client',
        emptyOutDir: true,
        sourcemap: process.env.NODE_ENV !== 'production',
        minify: process.env.NODE_ENV === 'production' ? 'terser' : false,
        rollupOptions: {
          output: {
            manualChunks: {
              phaser: ['phaser'],
              colyseus: ['colyseus.js']
            }
          }
        }
      }
    });

    console.log('\n✓ Client build completed');
  } catch (error) {
    console.error('❌ Client build failed:', error);
    process.exit(1);
  }
}

// Run build
buildClient();
```

### build-server.js

```javascript
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

/**
 * Build server code with TypeScript compiler
 */
async function buildServer() {
  console.log('Building server...\n');

  try {
    const { stdout, stderr } = await execPromise('tsc -p tsconfig.server.json');

    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);

    console.log('✓ Server build completed');
  } catch (error) {
    console.error('❌ Server build failed:', error.message);
    process.exit(1);
  }
}

// Run build
buildServer();
```

### build-all.js

```javascript
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

/**
 * Build both client and server
 */
async function buildAll() {
  console.log('Building all...\n');

  try {
    // Build client
    console.log('Building client...');
    await execPromise('node scripts/build-client.js');

    // Build server
    console.log('\nBuilding server...');
    await execPromise('node scripts/build-server.js');

    console.log('\n✓ All builds completed');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Run build
buildAll();
```

---

## Clean Script

### clean.js

```javascript
const fs = require('fs');
const path = require('path');

/**
 * Clean build artifacts
 */
function clean() {
  console.log('Cleaning build artifacts...\n');

  const dirsToClean = [
    'dist',
    'node_modules/.vite',
    'coverage'
  ];

  dirsToClean.forEach(dir => {
    const fullPath = path.join(__dirname, '..', dir);

    if (fs.existsSync(fullPath)) {
      console.log(`Removing ${dir}...`);
      fs.rmSync(fullPath, { recursive: true, force: true });
    }
  });

  console.log('\n✓ Clean completed');
}

// Run clean
clean();
```

### Usage

```bash
npm run clean
```

Add to `package.json`:

```json
{
  "scripts": {
    "clean": "node scripts/clean.js"
  }
}
```

---

## Electron Packaging Script

### package-electron.js

```javascript
const builder = require('electron-builder');
const path = require('path');

/**
 * Package Electron app for distribution
 */
async function packageElectron() {
  console.log('Packaging Electron app...\n');

  try {
    await builder.build({
      projectDir: path.join(__dirname, '..'),
      config: {
        appId: 'com.yourstudio.discus',
        productName: 'DISCUS',
        directories: {
          output: 'dist/electron',
          buildResources: 'build'
        },
        files: [
          'dist/client/**/*',
          'dist/server/**/*',
          'assets/**/*',
          'package.json'
        ],
        win: {
          target: ['nsis', 'portable'],
          icon: 'build/icon.ico'
        },
        mac: {
          target: ['dmg', 'zip'],
          icon: 'build/icon.icns',
          category: 'public.app-category.games'
        },
        linux: {
          target: ['AppImage', 'deb'],
          icon: 'build/icon.png',
          category: 'Game'
        }
      }
    });

    console.log('\n✓ Electron packaging completed');
  } catch (error) {
    console.error('❌ Electron packaging failed:', error);
    process.exit(1);
  }
}

// Run packaging
packageElectron();
```

### Usage

```bash
npm run electron:build
```

Add to `package.json`:

```json
{
  "scripts": {
    "electron:build": "node scripts/package-electron.js"
  }
}
```

---

## Script Utilities

### logger.js

```javascript
/**
 * Logging utilities for scripts
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function info(message) {
  console.log(`${colors.blue}ℹ${colors.reset} ${message}`);
}

function success(message) {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

function error(message) {
  console.error(`${colors.red}✗${colors.reset} ${message}`);
}

function warn(message) {
  console.warn(`${colors.yellow}⚠${colors.reset} ${message}`);
}

function header(message) {
  console.log(`\n${colors.bright}${message}${colors.reset}\n`);
}

module.exports = {
  info,
  success,
  error,
  warn,
  header
};
```

### file-utils.js

```javascript
const fs = require('fs');
const path = require('path');

/**
 * File system utilities for scripts
 */

/**
 * Ensure directory exists, create if it doesn't
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Copy file from source to destination
 */
function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

/**
 * Copy directory recursively
 */
function copyDir(src, dest) {
  ensureDir(dest);

  const entries = fs.readdirSync(src, { withFileTypes: true });

  entries.forEach(entry => {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  });
}

/**
 * Remove directory recursively
 */
function removeDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

/**
 * Get all files in directory matching pattern
 */
function getFiles(dirPath, pattern) {
  const files = [];

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    entries.forEach(entry => {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (pattern.test(entry.name)) {
        files.push(fullPath);
      }
    });
  }

  walk(dirPath);
  return files;
}

module.exports = {
  ensureDir,
  copyFile,
  copyDir,
  removeDir,
  getFiles
};
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/build.yml
name: Build and Test

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Validate config
        run: npm run validate:config

      - name: Run tests
        run: npm run test

      - name: Build client
        run: npm run build:client

      - name: Build server
        run: npm run build:server

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build
          path: dist/
```

---

## Pre-commit Hook

### .husky/pre-commit

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "Running pre-commit checks..."

# Validate config
npm run validate:config || exit 1

# Run linter
npm run lint || exit 1

# Run tests
npm run test || exit 1

echo "✓ Pre-commit checks passed"
```

### Setup Husky

```bash
npm install -D husky
npx husky install
npx husky add .husky/pre-commit "npm run validate:config && npm run lint && npm run test"
```

---

## Package.json Scripts

### Complete Script List

```json
{
  "scripts": {
    "dev:client": "vite",
    "dev:server": "nodemon --watch src/server --exec ts-node src/server/index.ts",
    "dev": "concurrently \"npm run dev:client\" \"npm run dev:server\"",
    "build:client": "node scripts/build-client.js",
    "build:server": "node scripts/build-server.js",
    "build": "node scripts/build-all.js",
    "clean": "node scripts/clean.js",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write src/**/*.ts",
    "validate:config": "node scripts/validate-config.js",
    "electron:dev": "electron .",
    "electron:build": "node scripts/package-electron.js",
    "precommit": "npm run validate:config && npm run lint && npm run test"
  }
}
```

---

## Error Handling Best Practices

### 1. Graceful Failure

```javascript
async function buildProject() {
  try {
    await build();
    console.log('✓ Build completed');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1); // Exit with error code
  }
}
```

### 2. Helpful Error Messages

```javascript
if (!fs.existsSync(configPath)) {
  console.error(`❌ Config file not found: ${configPath}`);
  console.error('Please create the config file and try again.');
  process.exit(1);
}
```

### 3. Progress Indicators

```javascript
console.log('Building client...');
// ... build steps
console.log('✓ Client built');

console.log('Building server...');
// ... build steps
console.log('✓ Server built');

console.log('\n✓ All builds completed');
```

---

## Release Checklist Script

### check-release.js

```javascript
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

async function checkRelease() {
  console.log('Checking release readiness...\n');

  const checks = [
    checkTests,
    checkConfig,
    checkVersionUpdated,
    checkChangelogUpdated,
    checkBuildSuccess
  ];

  let allPassed = true;

  for (const check of checks) {
    try {
      await check();
    } catch (error) {
      console.error(`❌ ${error.message}`);
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log('\n✓ All release checks passed');
  } else {
    console.error('\n❌ Release checks failed');
    process.exit(1);
  }
}

async function checkTests() {
  console.log('Running tests...');
  await execPromise('npm run test');
  console.log('✓ Tests passed');
}

async function checkConfig() {
  console.log('Validating config...');
  await execPromise('npm run validate:config');
  console.log('✓ Config valid');
}

function checkVersionUpdated() {
  console.log('Checking version...');
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8')
  );

  if (packageJson.version === '0.1.0') {
    throw new Error('Version not updated in package.json');
  }

  console.log(`✓ Version: ${packageJson.version}`);
}

function checkChangelogUpdated() {
  console.log('Checking changelog...');
  const changelogPath = path.join(__dirname, '../docs/changelog.md');

  if (!fs.existsSync(changelogPath)) {
    throw new Error('Changelog not found');
  }

  const changelog = fs.readFileSync(changelogPath, 'utf8');

  if (!changelog.includes(new Date().getFullYear().toString())) {
    throw new Error('Changelog not updated for current year');
  }

  console.log('✓ Changelog updated');
}

async function checkBuildSuccess() {
  console.log('Building project...');
  await execPromise('npm run build');
  console.log('✓ Build successful');
}

checkRelease();
```

---

## Resources

**Node.js:**
- File System API: https://nodejs.org/api/fs.html
- Child Process: https://nodejs.org/api/child_process.html

**Vite:**
- Build API: https://vitejs.dev/guide/api-javascript.html

**Electron Builder:**
- Configuration: https://www.electron.build/configuration/configuration

---

## Key Reminders

- **Error handling** - Always handle errors gracefully
- **Exit codes** - Use process.exit(1) for failures
- **Helpful messages** - Clear error messages and instructions
- **Idempotent** - Safe to run multiple times
- **Documented** - Comment complex logic
- **Test scripts** - Test scripts before committing
