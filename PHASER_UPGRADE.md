# Phaser v4 Upgrade Guide

## Current Version
This project is currently using **Phaser v4.0.0-rc.4** (Release Candidate 4).

## Upgrading to Final Phaser v4

When Phaser v4 final version is released, follow these simple steps:

### Step 1: Update package.json
Edit `package.json` and change the Phaser version:

```json
"dependencies": {
  "phaser": "^4.0.0"  // Change from "4.0.0-rc.4" to this
}
```

### Step 2: Install the update
Run the following command:

```bash
npm install
```

### Step 3: Test your game
After updating, test your game thoroughly as there may be API changes between RC4 and the final release.

```bash
npm run dev
npm run test
```

### Quick Update Command
Or simply run this one-liner:

```bash
npm install phaser@^4.0.0
```

## Checking for Updates

To check what Phaser versions are available:

```bash
npm view phaser versions
```

To check specifically for v4 versions:

```bash
npm view phaser versions | grep "4.0.0"
```

## Version Strategy

- **Current**: `4.0.0-rc.4` (exact version, no auto-updates)
- **Final**: `^4.0.0` (allows automatic minor and patch updates in 4.x range)

The caret (^) prefix allows npm to automatically install compatible updates (4.0.x, 4.1.x, etc.) but not breaking changes (5.0.0+).

## API Documentation

- [Phaser 4 Documentation](https://newdocs.phaser.io/docs/4.0.0)
- [Phaser 4 Examples](https://labs.phaser.io/)
- [Migration Guide](https://phaser.io/news)
