# Configuration System Guide

**Folder:** `src/config/`
**Purpose:** JSON configuration files for all gameplay tuning

---

## Overview

This folder contains all configuration files for the DISCUS game. **All gameplay numbers must be in JSON configuration files, never hardcoded in game logic.**

## Configuration Philosophy

**Core Principle:** Configuration-driven gameplay enables:
- Runtime tuning without recompilation
- Environment-specific overrides (dev/prod)
- Easy balance adjustments
- Configuration validation via JSON Schema
- Designer-friendly tuning (no code changes needed)

---

## Folder Structure

```
src/config/
├── base.json              # Base configuration (all environments)
├── dev.json               # Development overrides
├── prod.json              # Production overrides
├── physics.json           # Physics tuning values
├── gameplay.json          # Gameplay tuning values
├── network.json           # Network settings
│
└── schemas/               # JSON Schema definitions
    ├── config.schema.json
    └── gameplay.schema.json
```

---

## Configuration Hierarchy

```
base.json           # Default values for all environments
    ↓
dev.json            # Development overrides (e.g., debug mode ON)
    ↓
prod.json           # Production overrides (e.g., debug mode OFF)
```

**Loading Priority:** `base.json` → `env-specific.json` → Environment variables

---

## Configuration Files

### base.json

Base configuration for all environments:

```json
{
  "server": {
    "port": 2567,
    "tickRate": 60,
    "snapshotRate": 20
  },
  "client": {
    "targetFPS": 60,
    "debugOverlay": true
  },
  "game": {
    "maxPlayers": 16,
    "minPlayers": 2,
    "matchDuration": 180
  }
}
```

### dev.json

Development overrides:

```json
{
  "client": {
    "debugOverlay": true
  },
  "server": {
    "verbose": true
  }
}
```

### prod.json

Production overrides:

```json
{
  "client": {
    "debugOverlay": false
  },
  "server": {
    "verbose": false
  }
}
```

### physics.json

Physics tuning values:

```json
{
  "player": {
    "speed": 200,
    "acceleration": 800,
    "friction": 600,
    "radius": 16
  },
  "discus": {
    "throwSpeed": 400,
    "threatDuration": 3000,
    "returnSpeed": 300,
    "radius": 8
  },
  "collision": {
    "bounceWallMultiplier": 1.2,
    "bumpWallMultiplier": 1.5
  }
}
```

### gameplay.json

Gameplay tuning values:

```json
{
  "combat": {
    "perfectBlockWindow": 3,
    "perfectDodgeWindow": 2,
    "dodgeCooldown": 1000,
    "respawnInvulnerability": 2000
  },
  "scoring": {
    "disintegrationPoints": 1,
    "mercyEndThreshold": 10,
    "suddenDeathEnabled": true
  }
}
```

### network.json

Network settings:

```json
{
  "latency": {
    "simulatedDelay": 0,
    "maxBufferSize": 10
  },
  "interpolation": {
    "delay": 100,
    "method": "linear"
  },
  "reconciliation": {
    "errorThreshold": 5,
    "smoothingFactor": 0.2
  }
}
```

---

## Accessing Configuration

### ConfigLoader Pattern

```typescript
import { ConfigLoader } from '../shared/utils/ConfigLoader';

const config = ConfigLoader.getInstance();

// Read values
const playerSpeed = config.get('physics.player.speed');
const maxPlayers = config.get('game.maxPlayers');
const tickRate = config.get('server.tickRate');

// Use in code
player.velocity.x = input.moveX * playerSpeed;
```

### Never Hardcode Values

```typescript
// ❌ BAD: Magic numbers
if (player.speed > 200) {
  player.isSprinting = true;
}

// ✅ GOOD: Use config
const MAX_WALK_SPEED = config.get('physics.player.speed');
if (player.speed > MAX_WALK_SPEED) {
  player.isSprinting = true;
}
```

---

## JSON Schema Validation

### Schema Definition

**`schemas/config.schema.json`:**

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "server": {
      "type": "object",
      "properties": {
        "port": {
          "type": "integer",
          "minimum": 1024,
          "maximum": 65535
        },
        "tickRate": {
          "type": "integer",
          "minimum": 30,
          "maximum": 120
        },
        "snapshotRate": {
          "type": "integer",
          "minimum": 10,
          "maximum": 60
        }
      },
      "required": ["port", "tickRate", "snapshotRate"]
    },
    "client": {
      "type": "object",
      "properties": {
        "targetFPS": {
          "type": "integer",
          "minimum": 30,
          "maximum": 144
        },
        "debugOverlay": {
          "type": "boolean"
        }
      },
      "required": ["targetFPS", "debugOverlay"]
    },
    "game": {
      "type": "object",
      "properties": {
        "maxPlayers": {
          "type": "integer",
          "minimum": 2,
          "maximum": 32
        },
        "minPlayers": {
          "type": "integer",
          "minimum": 1,
          "maximum": 32
        },
        "matchDuration": {
          "type": "integer",
          "minimum": 30,
          "maximum": 600
        }
      },
      "required": ["maxPlayers", "minPlayers", "matchDuration"]
    }
  },
  "required": ["server", "client", "game"]
}
```

### Validation Script

**`scripts/validate-config.js`:**

```javascript
const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');

const ajv = new Ajv();

// Load schema
const schema = require('../src/config/schemas/config.schema.json');

// Load configs to validate
const baseConfig = require('../src/config/base.json');
const devConfig = require('../src/config/dev.json');
const prodConfig = require('../src/config/prod.json');

// Compile validator
const validate = ajv.compile(schema);

// Validate base config
console.log('Validating base.json...');
const validBase = validate(baseConfig);
if (!validBase) {
  console.error('❌ base.json validation failed:');
  console.error(validate.errors);
  process.exit(1);
}
console.log('✓ base.json is valid');

// Merge and validate dev config
console.log('Validating dev.json...');
const devMerged = { ...baseConfig, ...devConfig };
const validDev = validate(devMerged);
if (!validDev) {
  console.error('❌ dev.json validation failed:');
  console.error(validate.errors);
  process.exit(1);
}
console.log('✓ dev.json is valid');

// Merge and validate prod config
console.log('Validating prod.json...');
const prodMerged = { ...baseConfig, ...prodConfig };
const validProd = validate(prodMerged);
if (!validProd) {
  console.error('❌ prod.json validation failed:');
  console.error(validate.errors);
  process.exit(1);
}
console.log('✓ prod.json is valid');

console.log('\n✓ All configurations are valid');
```

### Running Validation

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

## Configuration Best Practices

### 1. All Gameplay Values in Config

```typescript
// ❌ BAD: Hardcoded in code
const PLAYER_SPEED = 200;
const DISCUS_SPEED = 400;

// ✅ GOOD: Load from config
const playerSpeed = config.get('physics.player.speed');
const discusSpeed = config.get('physics.discus.throwSpeed');
```

### 2. Use Descriptive Names

```json
// ❌ BAD: Unclear names
{
  "p1": 200,
  "p2": 400,
  "p3": 16
}

// ✅ GOOD: Clear names
{
  "player": {
    "speed": 200,
    "acceleration": 400,
    "radius": 16
  }
}
```

### 3. Group Related Values

```json
// ❌ BAD: Flat structure
{
  "playerSpeed": 200,
  "playerRadius": 16,
  "discusSpeed": 400,
  "discusRadius": 8
}

// ✅ GOOD: Grouped structure
{
  "player": {
    "speed": 200,
    "radius": 16
  },
  "discus": {
    "speed": 400,
    "radius": 8
  }
}
```

### 4. Document Units

```json
{
  "combat": {
    "perfectBlockWindow": 3,        // frames
    "perfectDodgeWindow": 2,        // frames
    "dodgeCooldown": 1000,          // milliseconds
    "respawnInvulnerability": 2000  // milliseconds
  }
}
```

### 5. Use Reasonable Defaults

```json
{
  "server": {
    "port": 2567,        // Standard Colyseus port
    "tickRate": 60,      // 60 FPS standard
    "snapshotRate": 20   // 20 Hz is good for most games
  }
}
```

---

## Environment Variables

You can override config values with environment variables:

```bash
# Set environment
NODE_ENV=production

# Override specific values
SERVER_PORT=3000
CLIENT_DEBUG=false
```

Then in ConfigLoader:

```typescript
private loadConfig(): void {
  const env = process.env.NODE_ENV || 'development';
  const envConfig = env === 'production' ? prodConfig : devConfig;

  this.config = this.deepMerge(baseConfig, envConfig);

  // Override with environment variables
  if (process.env.SERVER_PORT) {
    this.config.server.port = parseInt(process.env.SERVER_PORT);
  }
  if (process.env.CLIENT_DEBUG) {
    this.config.client.debugOverlay = process.env.CLIENT_DEBUG === 'true';
  }
}
```

---

## Hot Reloading Configuration

For development, you can enable hot reloading of config files:

```typescript
// Watch config files for changes
import { watch } from 'fs';

export class ConfigLoader {
  private watchConfigFiles(): void {
    if (process.env.NODE_ENV !== 'development') return;

    const configFiles = [
      'base.json',
      'dev.json',
      'physics.json',
      'gameplay.json',
      'network.json'
    ];

    configFiles.forEach(file => {
      const filePath = path.join(__dirname, '../../config', file);
      watch(filePath, () => {
        console.log(`Config file ${file} changed, reloading...`);
        this.loadConfig();
      });
    });
  }
}
```

---

## Common Configuration Values

### Physics Tuning

```json
{
  "player": {
    "speed": 200,           // Movement speed (pixels/second)
    "acceleration": 800,    // Acceleration (pixels/second²)
    "friction": 600,        // Friction (pixels/second²)
    "radius": 16            // Collision radius (pixels)
  },
  "discus": {
    "throwSpeed": 400,      // Initial throw speed (pixels/second)
    "threatDuration": 3000, // How long discus is threat (ms)
    "returnSpeed": 300,     // Return speed when inert (pixels/second)
    "radius": 8             // Collision radius (pixels)
  }
}
```

### Network Tuning

```json
{
  "server": {
    "tickRate": 60,         // Simulation rate (Hz)
    "snapshotRate": 20      // Update rate to clients (Hz)
  },
  "client": {
    "interpolationDelay": 100,      // Interpolation buffer (ms)
    "reconciliationThreshold": 5    // Error threshold (pixels)
  }
}
```

### Gameplay Tuning

```json
{
  "combat": {
    "perfectBlockWindow": 3,        // Perfect block window (frames)
    "perfectDodgeWindow": 2,        // Perfect dodge window (frames)
    "dodgeCooldown": 1000,          // Dodge cooldown (ms)
    "respawnInvulnerability": 2000  // Respawn invulnerability (ms)
  }
}
```

---

## Resources

**JSON Schema:**
- Specification: https://json-schema.org/
- Validator (AJV): https://ajv.js.org/

**Configuration Patterns:**
- 12-Factor App: https://12factor.net/config
- Environment Variables: https://nodejs.org/api/process.html#process_process_env

---

## Key Reminders

- **All gameplay values in config** - Never hardcode
- **Validate with JSON Schema** - Catch errors early
- **Use descriptive names** - Make it clear what each value does
- **Document units** - Specify if values are frames, ms, pixels, etc.
- **Group related values** - Organize config logically
- **Environment-specific overrides** - Use dev.json and prod.json
