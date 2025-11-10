# DISCUS - Claude CLI Development Guide

**Version:** 1.0  
**Last Updated:** 2025-11-10  
**Project Status:** Framework Setup Phase  
**GDD Reference:** v23

---

## Document Purpose

This document serves as the authoritative guide for Claude CLI when scaffolding and developing the DISCUS multiplayer game. It derives from the canonical Game Design Document (GDD v23) and translates high-level design into concrete technical implementation guidance.

**Key Principle:** This is a living document that grows with the project. Add new sections, refinements, and learnings as development progresses.

---

## Table of Contents

1. [Quick Start Setup](#1-quick-start-setup)
2. [Project Architecture](#2-project-architecture)
3. [Folder Structure](#3-folder-structure)
4. [Dependencies & Installation](#4-dependencies--installation)
5. [Configuration System](#5-configuration-system)
6. [Development Workflow](#6-development-workflow)
7. [Multiplayer Architecture](#7-multiplayer-architecture)
8. [Code Organization Principles](#8-code-organization-principles)
9. [Testing Strategy](#9-testing-strategy)
10. [Build & Packaging](#10-build--packaging)
11. [Common Patterns](#11-common-patterns)
12. [Troubleshooting](#12-troubleshooting)
13. [References & Resources](#13-references--resources)
14. [Progress Tracking](#14-progress-tracking)

---

## 1. Quick Start Setup

### 1.1 Prerequisites

**Required:**
- Node.js 20.x LTS or higher
- npm 10.x or higher
- Git 2.40+
- TypeScript 5.3+
- VS Code (recommended) or similar editor with TypeScript support

**Platform Testing:**
- Chrome Desktop (primary development)
- Chromium-based browser for parity testing

**Recommended:**
- Git LFS (for large art/audio assets)
- Gamepad for input testing

### 1.2 Initial Setup Commands

```bash
# 1. Create project directory
mkdir discus-game
cd discus-game

# 2. Initialize Git repository
git init
git lfs install  # If using LFS for assets

# 3. Initialize npm projects (monorepo structure)
npm init -y

# 4. Install core dependencies (see section 4 for complete list)
npm install phaser@^4.0.0 colyseus@^0.15.0 typescript@^5.3.0

# 5. Install dev dependencies
npm install -D vite@^5.0.0 electron@^28.0.0 electron-builder@^24.0.0

# 6. Initialize TypeScript
npx tsc --init
```

### 1.3 First Run Goal

After setup, you should be able to:
1. Start Colyseus server on `localhost:2567`
2. Launch Vite dev server on `localhost:5173`
3. See debug overlay with FPS counter
4. Connect to server room and see "Connected" message in console

---

## 2. Project Architecture

### 2.1 Core Technology Stack

**Client-Side:**
- **Framework:** Phaser 4 (WebGL renderer, Canvas fallback)
- **Physics:** Arcade Physics (lightweight, arcade-style)
- **Bundler:** Vite (fast HMR during development)
- **Language:** TypeScript (strict mode)

**Server-Side:**
- **Framework:** Node.js with Colyseus
- **Language:** TypeScript
- **Architecture:** Authoritative server, room-based multiplayer
- **State Management:** Colyseus Schema for serialization

**Packaging:**
- **Desktop:** Electron + electron-builder
- **Platforms:** Windows, macOS (Linux optional)

**Shared:**
- Config schemas (JSON Schema validation)
- Type definitions
- Constants and enums

### 2.2 Architectural Principles

**1. Authoritative Server Pattern**
- Server has final authority on all game state
- Clients predict ONLY player movement
- Server validates and corrects all actions
- No client-side hit detection or scoring

**2. Separation of Concerns**
- One mechanic per file
- No DOM/Electron code in game mechanics
- JSON-only tuning (no hardcoded gameplay values)
- Modular programming with single responsibility

**3. Network Architecture**
- Server tick rate: 60 Hz (16.67ms simulation)
- Snapshot rate: 20-30 Hz to clients
- Client-side prediction for local player movement
- Entity interpolation for remote players
- Server reconciliation when misprediction detected

**4. State Management Flow**
```
User Input → Client Prediction → Server Validation → State Update → Broadcast → Client Reconciliation
```

---

## 3. Folder Structure

### 3.1 Complete Directory Tree

```
discus-game/
├── .clinerules                      # Claude CLI behavioral rules
├── .gitignore
├── .gitattributes                   # Git LFS configuration
├── package.json                     # Root package management
├── tsconfig.json                    # Root TypeScript config
├── tsconfig.client.json             # Client-specific TS config
├── tsconfig.server.json             # Server-specific TS config
├── vite.config.ts                   # Vite bundler config
├── electron-builder.config.js       # Electron packaging config
├── README.md                        # Project overview
│
├── docs/                            # Documentation
│   ├── GDD_v23.md                  # Game Design Document (canonical)
│   ├── architecture.md             # System architecture details
│   ├── networking.md               # Multiplayer implementation notes
│   └── changelog.md                # Version history
│
├── src/                            # Source code root
│   │
│   ├── client/                     # Client-side code
│   │   ├── index.html             # Entry HTML
│   │   ├── main.ts                # Client entry point
│   │   │
│   │   ├── scenes/                # Phaser scenes
│   │   │   ├── BootScene.ts      # Memory check sequence
│   │   │   ├── LogosScene.ts     # Publisher logos
│   │   │   ├── StartScene.ts     # Main menu
│   │   │   ├── LobbyScene.ts     # Multiplayer lobby
│   │   │   ├── CharSelectScene.ts # Character selection
│   │   │   ├── TeamSelectScene.ts # Team zone selection
│   │   │   ├── GameScene.ts      # Main gameplay
│   │   │   ├── SpectatorScene.ts # Spectator mode
│   │   │   └── ResultsScene.ts   # End-of-match results
│   │   │
│   │   ├── entities/              # Game entities (client representation)
│   │   │   ├── Player.ts         # Player entity
│   │   │   ├── Discus.ts         # Discus projectile
│   │   │   ├── Drone.ts          # Hazard drone
│   │   │   └── Hazard.ts         # Environmental hazards
│   │   │
│   │   ├── systems/               # Client-side systems
│   │   │   ├── InputManager.ts   # Keyboard/mouse/gamepad input
│   │   │   ├── PredictionSystem.ts # Client-side prediction
│   │   │   ├── InterpolationSystem.ts # Entity interpolation
│   │   │   ├── ReconciliationSystem.ts # Server reconciliation
│   │   │   ├── CameraController.ts # Camera follow/zoom
│   │   │   └── AudioManager.ts   # Sound effects and music
│   │   │
│   │   ├── ui/                    # UI components
│   │   │   ├── HUD.ts            # In-game HUD
│   │   │   ├── Scoreboard.ts    # Match scoreboard
│   │   │   ├── Menu.ts           # Menu system
│   │   │   ├── SettingsPanel.ts # Settings UI
│   │   │   └── DebugOverlay.ts  # Debug information
│   │   │
│   │   ├── network/               # Client networking
│   │   │   ├── ColyseusClient.ts # Colyseus client wrapper
│   │   │   ├── RoomManager.ts    # Room connection handling
│   │   │   └── MessageHandlers.ts # Server message processing
│   │   │
│   │   ├── rendering/             # Rendering utilities
│   │   │   ├── TrailRenderer.ts  # Discus trail effects
│   │   │   ├── OutlineShader.ts  # Colorblind outlines
│   │   │   ├── ParticleSystem.ts # Particle effects
│   │   │   └── SpriteLoader.ts   # Asset loading
│   │   │
│   │   └── utils/                 # Client utilities
│   │       ├── ColorblindMode.ts # Colorblind palette swaps
│   │       ├── MathUtils.ts      # Math helpers
│   │       └── PerformanceMonitor.ts # FPS/latency tracking
│   │
│   ├── server/                    # Server-side code
│   │   ├── index.ts              # Server entry point
│   │   │
│   │   ├── rooms/                # Colyseus rooms
│   │   │   ├── GameRoom.ts      # Main game room
│   │   │   ├── LobbyRoom.ts     # Lobby/waiting room
│   │   │   └── ArcadeRoom.ts    # Local arcade mode room
│   │   │
│   │   ├── entities/             # Server-side entities (authoritative)
│   │   │   ├── ServerPlayer.ts  # Server player state
│   │   │   ├── ServerDiscus.ts  # Server discus physics
│   │   │   ├── ServerDrone.ts   # Server drone AI
│   │   │   └── ServerHazard.ts  # Server hazard state
│   │   │
│   │   ├── systems/              # Server-side systems
│   │   │   ├── PhysicsSystem.ts # Authoritative physics
│   │   │   ├── CollisionSystem.ts # Hit detection
│   │   │   ├── ScoreSystem.ts   # Score tracking
│   │   │   ├── MatchTimer.ts    # Match timing logic
│   │   │   ├── InputValidator.ts # Input validation
│   │   │   └── StateSnapshot.ts # State serialization
│   │   │
│   │   ├── ai/                   # AI behaviors
│   │   │   ├── DroneAI.ts       # Drone movement patterns
│   │   │   └── CPUPlayer.ts     # CPU-controlled players
│   │   │
│   │   └── utils/                # Server utilities
│   │       ├── TickScheduler.ts # 60Hz tick management
│   │       └── NetworkUtils.ts  # Network helpers
│   │
│   ├── shared/                   # Code shared between client/server
│   │   ├── types/               # TypeScript definitions
│   │   │   ├── GameState.ts    # Game state types
│   │   │   ├── PlayerState.ts  # Player state types
│   │   │   ├── InputTypes.ts   # Input message types
│   │   │   └── NetworkTypes.ts # Network protocol types
│   │   │
│   │   ├── schemas/             # Colyseus state schemas
│   │   │   ├── RoomState.ts    # Room state schema
│   │   │   ├── PlayerSchema.ts # Player schema
│   │   │   └── DiscusSchema.ts # Discus schema
│   │   │
│   │   ├── constants/           # Shared constants
│   │   │   ├── GameConstants.ts # Gameplay constants
│   │   │   ├── PhysicsConstants.ts # Physics values
│   │   │   └── NetworkConstants.ts # Network settings
│   │   │
│   │   └── utils/               # Shared utilities
│   │       ├── Vector2.ts      # 2D vector math
│   │       ├── CollisionUtils.ts # Collision helpers
│   │       └── Interpolation.ts # Interpolation math
│   │
│   └── config/                  # Configuration files
│       ├── base.json           # Base configuration
│       ├── dev.json            # Development overrides
│       ├── prod.json           # Production overrides
│       ├── physics.json        # Physics tuning values
│       ├── gameplay.json       # Gameplay tuning values
│       ├── network.json        # Network settings
│       └── schemas/            # JSON Schema definitions
│           ├── config.schema.json
│           └── gameplay.schema.json
│
├── assets/                     # Game assets (not in src/)
│   ├── sprites/               # Sprite sheets and textures
│   │   ├── players/          # Player sprites
│   │   ├── discus/           # Discus sprites
│   │   ├── hazards/          # Hazard sprites
│   │   └── ui/               # UI elements
│   │
│   ├── audio/                # Sound effects and music
│   │   ├── sfx/             # Sound effects
│   │   └── music/           # Background music
│   │
│   ├── fonts/               # Custom fonts
│   │
│   └── shaders/             # Custom shaders
│       └── outline.glsl     # Colorblind outline shader
│
├── tests/                   # Test files
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── e2e/                # End-to-end tests
│
├── scripts/                # Build and utility scripts
│   ├── build-client.js
│   ├── build-server.js
│   └── package-electron.js
│
└── dist/                   # Build output (gitignored)
    ├── client/            # Client build
    ├── server/            # Server build
    └── electron/          # Electron packages
```

### 3.2 Directory Descriptions

**`src/client/`** - All code that runs in the browser/Electron renderer process
- Phaser scenes, entities, UI, rendering
- Client-side prediction and interpolation
- Input handling and audio

**`src/server/`** - All code that runs in Node.js server process
- Colyseus rooms and authoritative logic
- Physics simulation and collision detection
- Match state and scoring
- AI behaviors

**`src/shared/`** - Code used by both client and server
- Type definitions and interfaces
- Colyseus state schemas
- Constants and configuration
- Pure utility functions (no DOM, no Node APIs)

**`src/config/`** - JSON configuration files
- All gameplay tuning values
- Network and performance settings
- Environment-specific overrides

**`assets/`** - Binary assets (images, audio, fonts)
- Not compiled by TypeScript
- Referenced by path from code
- May use Git LFS for large files

---

## 4. Dependencies & Installation

### 4.1 Core Runtime Dependencies

```json
{
  "dependencies": {
    "phaser": "^4.0.0",
    "colyseus": "^0.15.0",
    "colyseus.js": "^0.15.0",
    "@colyseus/schema": "^2.0.0",
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.0"
  }
}
```

**Installation:**
```bash
npm install phaser@^4.0.0 colyseus@^0.15.0 colyseus.js@^0.15.0 @colyseus/schema@^2.0.0 express@^4.18.0 cors@^2.8.5 dotenv@^16.3.0
```

### 4.2 Development Dependencies

```json
{
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0",
    "vite": "^5.0.0",
    "vite-plugin-html": "^3.2.0",
    "electron": "^28.0.0",
    "electron-builder": "^24.0.0",
    "eslint": "^8.55.0",
    "@typescript-eslint/parser": "^6.15.0",
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "prettier": "^3.1.0",
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "ajv": "^8.12.0",
    "concurrently": "^8.2.0",
    "nodemon": "^3.0.0"
  }
}
```

**Installation:**
```bash
npm install -D typescript@^5.3.0 @types/node@^20.10.0 vite@^5.0.0 electron@^28.0.0 electron-builder@^24.0.0 eslint@^8.55.0 @typescript-eslint/parser@^6.15.0 @typescript-eslint/eslint-plugin@^6.15.0 prettier@^3.1.0 vitest@^1.0.0 @vitest/ui@^1.0.0 ajv@^8.12.0 concurrently@^8.2.0 nodemon@^3.0.0
```

### 4.3 Optional Dependencies

```json
{
  "optionalDependencies": {
    "sharp": "^0.33.0"
  }
}
```

### 4.4 Package Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "dev:client": "vite",
    "dev:server": "nodemon --watch src/server --exec ts-node src/server/index.ts",
    "dev": "concurrently \"npm run dev:client\" \"npm run dev:server\"",
    "build:client": "vite build",
    "build:server": "tsc -p tsconfig.server.json",
    "build": "npm run build:client && npm run build:server",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write src/**/*.ts",
    "electron:dev": "electron .",
    "electron:build": "electron-builder",
    "validate:config": "node scripts/validate-config.js"
  }
}
```

### 4.5 External Resources to Download

**Phaser 4:**
- Documentation: https://phaser.io/phaser4
- GitHub: https://github.com/phaserjs/phaser
- API Reference: https://newdocs.phaser.io/docs/4.0.0

**Colyseus:**
- Documentation: https://docs.colyseus.io/
- Phaser Tutorial: https://docs.colyseus.io/tutorial/phaser/
- GitHub: https://github.com/colyseus/colyseus

**Electron:**
- Documentation: https://www.electronjs.org/docs/latest
- electron-builder: https://www.electron.build/

**TypeScript:**
- Handbook: https://www.typescriptlang.org/docs/handbook/intro.html
- tsconfig Reference: https://www.typescriptlang.org/tsconfig

---

## 5. Configuration System

### 5.1 Configuration Philosophy

**Core Principle:** All gameplay numbers must be in JSON configuration files, never hardcoded in game logic. This enables:
- Runtime tuning without recompilation
- Environment-specific overrides (dev/prod)
- Easy balance adjustments
- Configuration validation via JSON Schema

### 5.2 Configuration Hierarchy

```
base.json           # Default values for all environments
    ↓
dev.json            # Development overrides (e.g., debug mode ON)
    ↓
prod.json           # Production overrides (e.g., debug mode OFF)
```

**Loading Priority:** `base.json` → `env-specific.json` → Environment variables

### 5.3 Configuration File Structure

**`src/config/base.json`** - Base configuration:
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

**`src/config/physics.json`** - Physics tuning:
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

**`src/config/gameplay.json`** - Gameplay tuning:
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

**`src/config/network.json`** - Network settings:
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

### 5.4 Configuration Loader Implementation

**`src/shared/utils/ConfigLoader.ts`**:
```typescript
import baseConfig from '../../config/base.json';
import devConfig from '../../config/dev.json';
import prodConfig from '../../config/prod.json';
import physicsConfig from '../../config/physics.json';
import gameplayConfig from '../../config/gameplay.json';
import networkConfig from '../../config/network.json';

export class ConfigLoader {
  private static instance: ConfigLoader;
  private config: any;

  private constructor() {
    this.loadConfig();
  }

  public static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    return ConfigLoader.instance;
  }

  private loadConfig(): void {
    const env = process.env.NODE_ENV || 'development';
    const envConfig = env === 'production' ? prodConfig : devConfig;

    // Deep merge: base → env-specific → domain configs
    this.config = this.deepMerge(
      baseConfig,
      envConfig,
      {
        physics: physicsConfig,
        gameplay: gameplayConfig,
        network: networkConfig
      }
    );
  }

  public get(path: string): any {
    return this.getNestedValue(this.config, path);
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  }

  private deepMerge(target: any, ...sources: any[]): any {
    // Implementation of deep merge logic
    // (Standard deep merge algorithm)
  }
}

// Usage example:
// const config = ConfigLoader.getInstance();
// const playerSpeed = config.get('physics.player.speed');
```

### 5.5 JSON Schema Validation

**`src/config/schemas/config.schema.json`**:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "server": {
      "type": "object",
      "properties": {
        "port": { "type": "integer", "minimum": 1024, "maximum": 65535 },
        "tickRate": { "type": "integer", "minimum": 30, "maximum": 120 },
        "snapshotRate": { "type": "integer", "minimum": 10, "maximum": 60 }
      },
      "required": ["port", "tickRate", "snapshotRate"]
    }
  }
}
```

**Validation Script (`scripts/validate-config.js`):**
```javascript
const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');

const ajv = new Ajv();
const schema = require('../src/config/schemas/config.schema.json');
const baseConfig = require('../src/config/base.json');

const validate = ajv.compile(schema);
const valid = validate(baseConfig);

if (!valid) {
  console.error('Configuration validation failed:');
  console.error(validate.errors);
  process.exit(1);
}

console.log('✓ Configuration is valid');
```

---

## 6. Development Workflow

### 6.1 Daily Development Cycle

**Morning Startup:**
```bash
# Terminal 1: Start server with auto-reload
npm run dev:server

# Terminal 2: Start client with HMR
npm run dev:client

# Terminal 3: Run tests in watch mode (optional)
npm run test
```

**Development URLs:**
- Client: http://localhost:5173
- Server: ws://localhost:2567
- Vitest UI: http://localhost:51204/__vitest__/

### 6.2 Git Workflow

**Branch Strategy:**
```bash
main                    # Production-ready code
├── develop            # Integration branch
    ├── feature/movement      # Feature branches
    ├── feature/discus-throw
    └── bugfix/collision-sync
```

**Commit Message Format:**
```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Example:**
```
feat(client): implement client-side prediction for movement

- Add input sequence numbering
- Store pending inputs for reconciliation
- Apply prediction locally before server confirmation

Refs: #42
```

### 6.3 Code Review Checklist

Before committing code, verify:
- [ ] No hardcoded gameplay values (use config)
- [ ] Single responsibility per file
- [ ] No DOM code in shared/server directories
- [ ] TypeScript strict mode passes
- [ ] Unit tests written for new logic
- [ ] No console.logs (use proper logging)
- [ ] Comments explain "why", not "what"

### 6.4 Testing Workflow

**Run All Tests:**
```bash
npm run test
```

**Run Specific Test File:**
```bash
npm run test src/shared/utils/Vector2.test.ts
```

**Watch Mode:**
```bash
npm run test -- --watch
```

**Coverage Report:**
```bash
npm run test -- --coverage
```

---

## 7. Multiplayer Architecture

### 7.1 Network Architecture Overview

DISCUS uses an **authoritative server** architecture with **client-side prediction** for movement only.

**Key Concepts:**
1. **Server Authority:** Server has final say on all game state
2. **Client Prediction:** Clients predict their own movement locally
3. **Entity Interpolation:** Remote entities are smoothly interpolated
4. **Server Reconciliation:** Server corrects mispredictions

### 7.2 Server Tick System

**Server Loop (60 Hz):**
```typescript
// Pseudocode for server tick
setInterval(() => {
  // 1. Process all queued inputs from clients
  processInputQueue();
  
  // 2. Update physics simulation
  updatePhysics(deltaTime);
  
  // 3. Check collisions
  checkCollisions();
  
  // 4. Update scores
  updateScores();
  
  // 5. Broadcast state snapshots (at snapshot rate, not every tick)
  if (shouldBroadcastSnapshot()) {
    broadcastState();
  }
}, 1000 / 60); // 16.67ms per tick
```

**Snapshot Broadcasting (20-30 Hz):**
- Not every tick is sent to clients (too much bandwidth)
- Server sends snapshots 20-30 times per second
- Each snapshot includes timestamp and full state

### 7.3 Client-Side Prediction

**Movement Prediction Flow:**
```typescript
// Client predicts movement immediately
function handleInput(input: PlayerInput): void {
  // 1. Apply movement locally (instant feedback)
  predictMovement(input);
  
  // 2. Store input with sequence number
  pendingInputs.push({
    sequenceNumber: currentSequence++,
    input: input,
    timestamp: Date.now()
  });
  
  // 3. Send to server
  room.send('input', {
    sequenceNumber: currentSequence - 1,
    input: input
  });
}
```

**What Client Predicts:**
- ✅ Own player movement (walk, run)
- ✅ Own player position

**What Client Does NOT Predict:**
- ❌ Discus throwing/catching
- ❌ Hit detection
- ❌ Block/dodge results
- ❌ Score changes
- ❌ Other players' actions

### 7.4 Server Reconciliation

**Server Response:**
```typescript
// Server processes input and sends back authoritative state
room.onMessage('input', (client, message) => {
  const player = getPlayer(client.sessionId);
  
  // 1. Validate input
  if (!isValidInput(message.input)) return;
  
  // 2. Apply to authoritative state
  applyInput(player, message.input);
  
  // 3. Send acknowledgment with sequence number
  client.send('inputAck', {
    sequenceNumber: message.sequenceNumber,
    position: player.position,
    velocity: player.velocity,
    timestamp: Date.now()
  });
});
```

**Client Reconciliation:**
```typescript
// Client receives server correction
room.onMessage('inputAck', (message) => {
  // 1. Remove acknowledged input from pending queue
  const ackedInput = pendingInputs.find(
    input => input.sequenceNumber === message.sequenceNumber
  );
  pendingInputs = pendingInputs.filter(
    input => input.sequenceNumber > message.sequenceNumber
  );
  
  // 2. Check for misprediction
  const positionError = distance(localPlayer.position, message.position);
  
  if (positionError > ERROR_THRESHOLD) {
    // 3. Correct position
    localPlayer.position = message.position;
    
    // 4. Replay pending inputs on top of corrected state
    for (const input of pendingInputs) {
      applyInput(localPlayer, input.input);
    }
  }
});
```

### 7.5 Entity Interpolation

**For Remote Players:**
```typescript
// Client receives state snapshots
room.onStateChange((state) => {
  for (const playerId in state.players) {
    if (playerId === localPlayerId) continue; // Skip local player
    
    const serverPlayer = state.players[playerId];
    const clientPlayer = getClientPlayer(playerId);
    
    // Store snapshot for interpolation
    clientPlayer.addSnapshot({
      position: serverPlayer.position,
      velocity: serverPlayer.velocity,
      timestamp: Date.now()
    });
  }
});

// Update loop interpolates between snapshots
function update(delta: number): void {
  for (const player of remotePlayers) {
    // Render time is slightly behind real time (100ms buffer)
    const renderTime = Date.now() - INTERPOLATION_DELAY;
    
    // Find two snapshots to interpolate between
    const [snapshotA, snapshotB] = player.getSnapshotsForTime(renderTime);
    
    // Interpolate position
    const t = (renderTime - snapshotA.timestamp) / 
              (snapshotB.timestamp - snapshotA.timestamp);
    player.position = lerp(snapshotA.position, snapshotB.position, t);
  }
}
```

### 7.6 Input Message Format

**Client → Server:**
```typescript
interface PlayerInput {
  sequenceNumber: number;
  timestamp: number;
  moveX: number;        // -1, 0, or 1
  moveY: number;        // -1, 0, or 1
  throwing: boolean;
  blocking: boolean;
  dodging: boolean;
}
```

**Server → Client (Acknowledgment):**
```typescript
interface InputAck {
  sequenceNumber: number;
  timestamp: number;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
}
```

**Server → Client (State Snapshot):**
```typescript
interface StateSnapshot {
  timestamp: number;
  players: {
    [sessionId: string]: {
      position: { x: number; y: number };
      velocity: { x: number; y: number };
      state: 'idle' | 'moving' | 'blocking' | 'dodging' | 'disintegrated';
      hasDiscus: boolean;
    };
  };
  discuses: {
    [discusId: string]: {
      position: { x: number; y: number };
      velocity: { x: number; y: number };
      state: 'threat' | 'inert';
      ownerId: string;
    };
  };
  score: { [teamId: string]: number };
  matchTime: number;
}
```

### 7.7 Networking Constants

**From `src/config/network.json`:**
```json
{
  "server": {
    "tickRate": 60,
    "snapshotRate": 20
  },
  "client": {
    "interpolationDelay": 100,
    "reconciliationThreshold": 5
  }
}
```

**Explanation:**
- **tickRate (60 Hz):** Server simulates physics 60 times per second
- **snapshotRate (20 Hz):** Server sends state to clients 20 times per second
- **interpolationDelay (100ms):** Client renders 100ms behind to have snapshots to interpolate
- **reconciliationThreshold (5px):** If prediction error > 5 pixels, correct client position

### 7.8 Critical Networking Rules

1. **Server is always right** - Never trust client for hit detection or scoring
2. **Predict only movement** - Don't predict complex interactions
3. **Validate all inputs** - Server must validate every client message
4. **Interpolate remote entities** - Never trust immediate positions for remote players
5. **Handle packet loss** - System must work even with dropped packets
6. **Timestamp everything** - All messages must have timestamps for reconciliation

---

## 8. Code Organization Principles

### 8.1 Modular Architecture

**Single Responsibility Principle:**
- Each file has ONE clear purpose
- No "god objects" or classes doing everything
- Easy to test, easy to replace

**Example File Organization:**
```
❌ BAD: PlayerManager.ts (1000+ lines)
  - handles input
  - manages physics
  - draws sprites
  - plays sounds
  - manages network

✅ GOOD: Multiple focused files
  - PlayerInputHandler.ts (input only)
  - PlayerPhysics.ts (physics only)
  - PlayerRenderer.ts (rendering only)
  - PlayerAudio.ts (audio only)
  - PlayerNetworkSync.ts (networking only)
```

### 8.2 Separation of Concerns

**Client Code:**
- ✅ Can use: Phaser APIs, DOM, window, localStorage
- ❌ Cannot: Contain authoritative game logic

**Server Code:**
- ✅ Can use: Node APIs, Colyseus, file system
- ❌ Cannot: Contain rendering logic, DOM access

**Shared Code:**
- ✅ Can use: Pure TypeScript, math utilities
- ❌ Cannot: Use Node APIs, DOM, Phaser-specific code

### 8.3 Naming Conventions

**Files:**
- PascalCase for classes: `PlayerEntity.ts`
- camelCase for utilities: `mathUtils.ts`
- kebab-case for configs: `gameplay-config.json`

**Classes:**
- PascalCase: `class PlayerEntity`
- Descriptive nouns: `InputManager`, `CollisionSystem`

**Functions:**
- camelCase: `calculateVelocity()`, `handleInput()`
- Verb-first: `getPlayer()`, `updatePosition()`, `isColliding()`

**Variables:**
- camelCase: `playerSpeed`, `discusVelocity`
- Constants: UPPER_SNAKE_CASE: `MAX_PLAYERS`, `TICK_RATE`

**Interfaces/Types:**
- PascalCase with descriptive names: `PlayerState`, `InputMessage`
- Avoid generic names like `Data` or `Info`

### 8.4 Code Style Guidelines

**TypeScript Strict Mode:**
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

**Prefer Explicit Types:**
```typescript
// ❌ BAD: Implicit any
function processInput(input) {
  // ...
}

// ✅ GOOD: Explicit types
function processInput(input: PlayerInput): void {
  // ...
}
```

**Avoid Magic Numbers:**
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

**Comment Why, Not What:**
```typescript
// ❌ BAD: Obvious comment
// Set player speed to 200
player.speed = 200;

// ✅ GOOD: Explain reasoning
// Reduce speed during dodge to prevent exploits where players
// dodge repeatedly to move faster than walking
player.speed = 200;
```

---

## 9. Testing Strategy

### 9.1 Testing Philosophy

**Test Pyramid:**
```
         /\
        /  \  E2E Tests (few)
       /----\
      / Int- \  Integration Tests (some)
     / egrat \
    / ion Te \
   /  sts     \
  /------------\
 / Unit Tests   \  Unit Tests (many)
/  (foundation)  \
```

**What to Test:**
- ✅ Pure functions (math, utilities)
- ✅ Game logic (collision, scoring)
- ✅ State management
- ✅ Network message handling
- ❌ Don't test: Framework internals (Phaser, Colyseus)

### 9.2 Unit Testing Example

**`src/shared/utils/Vector2.test.ts`:**
```typescript
import { describe, it, expect } from 'vitest';
import { Vector2 } from './Vector2';

describe('Vector2', () => {
  describe('length', () => {
    it('calculates magnitude correctly', () => {
      const v = new Vector2(3, 4);
      expect(v.length()).toBe(5);
    });

    it('returns 0 for zero vector', () => {
      const v = new Vector2(0, 0);
      expect(v.length()).toBe(0);
    });
  });

  describe('normalize', () => {
    it('produces unit vector', () => {
      const v = new Vector2(3, 4);
      const normalized = v.normalize();
      expect(normalized.length()).toBeCloseTo(1, 5);
    });

    it('handles zero vector without crashing', () => {
      const v = new Vector2(0, 0);
      const normalized = v.normalize();
      expect(normalized.x).toBe(0);
      expect(normalized.y).toBe(0);
    });
  });
});
```

### 9.3 Integration Testing

**Test Colyseus Room Logic:**
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { GameRoom } from '../rooms/GameRoom';
import { ColyseusTestServer } from '@colyseus/testing';

describe('GameRoom', () => {
  let server: ColyseusTestServer;

  beforeEach(async () => {
    server = new ColyseusTestServer();
    server.define('game', GameRoom);
  });

  it('allows player to join', async () => {
    const room = await server.createRoom('game');
    const client = await server.connectTo(room);
    
    expect(room.state.players.size).toBe(1);
  });

  it('processes player input', async () => {
    const room = await server.createRoom('game');
    const client = await server.connectTo(room);
    
    client.send('input', { moveX: 1, moveY: 0 });
    
    // Wait for next tick
    await new Promise(resolve => setTimeout(resolve, 20));
    
    const player = room.state.players.get(client.sessionId);
    expect(player.position.x).toBeGreaterThan(0);
  });
});
```

### 9.4 Performance Testing

**Latency Harness:**
```typescript
// Test client-server round trip time
async function measureLatency(): Promise<number> {
  const start = performance.now();
  await room.send('ping', { timestamp: start });
  
  return new Promise((resolve) => {
    room.onMessage('pong', (message) => {
      const latency = performance.now() - message.timestamp;
      resolve(latency);
    });
  });
}
```

---

## 10. Build & Packaging

### 10.1 Development Build

**Client:**
```bash
npm run dev:client
# Vite serves on http://localhost:5173
# Hot module replacement (HMR) enabled
```

**Server:**
```bash
npm run dev:server
# Nodemon watches for changes
# Auto-restarts on file save
```

### 10.2 Production Build

**Client Build:**
```bash
npm run build:client
# Output: dist/client/
# - Minified JS bundles
# - Optimized assets
# - Source maps (optional)
```

**Server Build:**
```bash
npm run build:server
# Output: dist/server/
# - Transpiled TypeScript → JavaScript
# - Node.js ready
```

### 10.3 Electron Packaging

**Configuration (`electron-builder.config.js`):**
```javascript
module.exports = {
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
};
```

**Build Electron App:**
```bash
npm run electron:build
# Creates installers for each platform
# Output: dist/electron/
```

### 10.4 Release Checklist

Before releasing:
- [ ] All tests passing
- [ ] Configuration validated
- [ ] Version number updated in `package.json`
- [ ] Changelog updated
- [ ] Assets optimized (compressed)
- [ ] Performance targets met (≥60 FPS)
- [ ] Electron build tested on target platforms
- [ ] Accessibility features verified
- [ ] Network code tested with latency simulation

---

## 11. Common Patterns

### 11.1 Entity Creation Pattern

**Client Entity:**
```typescript
// src/client/entities/Player.ts
export class Player extends Phaser.GameObjects.Sprite {
  public sessionId: string;
  public velocity: Phaser.Math.Vector2;
  private serverSnapshots: Snapshot[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number, sessionId: string) {
    super(scene, x, y, 'player');
    this.sessionId = sessionId;
    this.velocity = new Phaser.Math.Vector2(0, 0);
    scene.add.existing(this);
  }

  public addSnapshot(snapshot: Snapshot): void {
    this.serverSnapshots.push(snapshot);
    // Keep only last 10 snapshots
    if (this.serverSnapshots.length > 10) {
      this.serverSnapshots.shift();
    }
  }

  public interpolate(renderTime: number): void {
    // Interpolation logic
  }

  public update(delta: number): void {
    // Per-frame update
  }
}
```

**Server Entity:**
```typescript
// src/server/entities/ServerPlayer.ts
export class ServerPlayer {
  public sessionId: string;
  public position: { x: number; y: number };
  public velocity: { x: number; y: number };
  public state: PlayerState;

  constructor(sessionId: string, spawnPosition: { x: number; y: number }) {
    this.sessionId = sessionId;
    this.position = { ...spawnPosition };
    this.velocity = { x: 0, y: 0 };
    this.state = 'idle';
  }

  public applyInput(input: PlayerInput, deltaTime: number): void {
    // Apply movement based on input
    const speed = CONFIG.PLAYER_SPEED;
    this.velocity.x = input.moveX * speed;
    this.velocity.y = input.moveY * speed;
    
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
  }

  public update(deltaTime: number): void {
    // Per-tick update (physics, state transitions)
  }
}
```

### 11.2 System Pattern

**System Structure:**
```typescript
// src/server/systems/CollisionSystem.ts
export class CollisionSystem {
  private players: Map<string, ServerPlayer>;
  private discuses: Map<string, ServerDiscus>;

  constructor(players: Map<string, ServerPlayer>, discuses: Map<string, ServerDiscus>) {
    this.players = players;
    this.discuses = discuses;
  }

  public update(deltaTime: number): CollisionEvent[] {
    const events: CollisionEvent[] = [];

    // Check all discus-player collisions
    for (const [discusId, discus] of this.discuses) {
      for (const [playerId, player] of this.players) {
        if (this.checkCollision(discus, player)) {
          events.push({
            type: 'discus-hit',
            discusId,
            playerId,
            timestamp: Date.now()
          });
        }
      }
    }

    return events;
  }

  private checkCollision(discus: ServerDiscus, player: ServerPlayer): boolean {
    // Collision detection logic
    const dx = discus.position.x - player.position.x;
    const dy = discus.position.y - player.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (discus.radius + player.radius);
  }
}
```

### 11.3 Config Access Pattern

**Accessing Config Values:**
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

### 11.4 Input Handling Pattern

**Client Input:**
```typescript
// src/client/systems/InputManager.ts
export class InputManager {
  private keys: Phaser.Types.Input.Keyboard.CursorKeys;
  private gamepad: Phaser.Input.Gamepad.Gamepad | null = null;
  private sequenceNumber: number = 0;

  constructor(scene: Phaser.Scene) {
    this.keys = scene.input.keyboard.createCursorKeys();
    scene.input.gamepad.once('connected', (pad) => {
      this.gamepad = pad;
    });
  }

  public getInput(): PlayerInput | null {
    let moveX = 0;
    let moveY = 0;

    // Keyboard input
    if (this.keys.left.isDown) moveX -= 1;
    if (this.keys.right.isDown) moveX += 1;
    if (this.keys.up.isDown) moveY -= 1;
    if (this.keys.down.isDown) moveY += 1;

    // Gamepad input (overrides keyboard)
    if (this.gamepad) {
      const leftStick = this.gamepad.leftStick;
      if (Math.abs(leftStick.x) > 0.2) moveX = leftStick.x;
      if (Math.abs(leftStick.y) > 0.2) moveY = leftStick.y;
    }

    // No input
    if (moveX === 0 && moveY === 0) return null;

    return {
      sequenceNumber: this.sequenceNumber++,
      timestamp: Date.now(),
      moveX,
      moveY,
      throwing: this.keys.space.isDown,
      blocking: this.keys.shift.isDown,
      dodging: this.keys.control.isDown
    };
  }
}
```

---

## 12. Troubleshooting

### 12.1 Common Issues

**Issue: Server not starting**
```
Error: listen EADDRINUSE :::2567
```
**Solution:** Port already in use
```bash
# Find process using port
lsof -i :2567
# Kill process
kill -9 <PID>
```

**Issue: Client can't connect to server**
```
WebSocket connection failed
```
**Solution:** Check CORS and server URL
```typescript
// In server/index.ts, ensure CORS is configured:
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

**Issue: Prediction/reconciliation errors**
```
Position mismatch > threshold
```
**Solution:** Check for float precision issues
```typescript
// Round positions to avoid float drift
player.position.x = Math.round(player.position.x * 100) / 100;
player.position.y = Math.round(player.position.y * 100) / 100;
```

**Issue: HMR not working in Vite**
**Solution:** Check Vite config accepts WebSocket connections
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    hmr: {
      protocol: 'ws',
      host: 'localhost'
    }
  }
});
```

### 12.2 Debug Strategies

**Enable Debug Overlay:**
```typescript
// In client config
config.client.debugOverlay = true;
```

**Server Logging:**
```typescript
// Add logging to server tick
console.log(`[Tick ${tickNumber}] Players: ${players.size}, Discuses: ${discuses.size}`);
```

**Network Latency Simulation:**
```typescript
// In network config
config.latency.simulatedDelay = 100; // Add 100ms artificial delay
```

**Performance Profiling:**
```typescript
// Use browser DevTools Performance tab
// Or add custom timing:
const start = performance.now();
// ... code to profile
const elapsed = performance.now() - start;
console.log(`Operation took ${elapsed}ms`);
```

---

## 13. References & Resources

### 13.1 Core Documentation

**Phaser 4:**
- Official Docs: https://phaser.io/phaser4
- API Reference: https://newdocs.phaser.io/docs/4.0.0
- Examples: https://labs.phaser.io/

**Colyseus:**
- Main Docs: https://docs.colyseus.io/
- Phaser Tutorial: https://docs.colyseus.io/tutorial/phaser/
- State Management: https://docs.colyseus.io/state/overview/

**TypeScript:**
- Handbook: https://www.typescriptlang.org/docs/handbook/intro.html
- Do's and Don'ts: https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html

### 13.2 Multiplayer Networking

**Gabriel Gambetta's Fast-Paced Multiplayer Series (CRITICAL):**
- Part I: https://www.gabrielgambetta.com/client-server-game-architecture.html
- Part II: https://www.gabrielgambetta.com/client-side-prediction-server-reconciliation.html
- Part III: https://www.gabrielgambetta.com/entity-interpolation.html
- Part IV: https://www.gabrielgambetta.com/lag-compensation.html
- Interactive Demo: https://www.gabrielgambetta.com/client-side-prediction-live-demo.html

**Additional Resources:**
- 4AM Games Reconciliation: https://fouramgames.com/blog/fast-paced-multiplayer-implementation-smooth-server-reconciliation
- Client-Side Prediction (Wikipedia): https://en.wikipedia.org/wiki/Client-side_prediction

### 13.3 Electron Packaging

- Electron Docs: https://www.electronjs.org/docs/latest
- electron-builder: https://www.electron.build/
- App Distribution: https://www.electronjs.org/docs/latest/tutorial/application-distribution

### 13.4 Community Resources

**Phaser Discord:** https://discord.gg/phaser
**Colyseus Discord:** https://discord.gg/RY8rRS7
**Game Dev Stack Exchange:** https://gamedev.stackexchange.com/

---

## 14. Progress Tracking

### 14.1 Current Status

**Phase:** Framework Setup  
**Date Started:** 2025-11-10  
**Milestone:** Vertical Slice  

**Completed:**
- [ ] Project structure created
- [ ] Dependencies installed
- [ ] TypeScript configured
- [ ] Vite dev server running
- [ ] Colyseus server starting
- [ ] Client-server connection established

**In Progress:**
- [ ] Config loader implementation
- [ ] Debug overlay
- [ ] Physics debug rendering

**Next Steps:**
- [ ] Implement player movement (client prediction)
- [ ] Implement input sequence numbering
- [ ] Implement server reconciliation
- [ ] Create basic arena (squares/circles)

### 14.2 Milestone Checklist

**Vertical Slice:**
- [ ] Core movement (client prediction + server authority)
- [ ] Throw mechanic (server-only validation)
- [ ] Block mechanic (server-only validation)
- [ ] Dodge mechanic (server-only validation)
- [ ] Catch mechanic (server-only validation)
- [ ] Basic arena (placeholder squares/circles)
- [ ] Physics feel locked
- [ ] Debug overlays functional
- [ ] Single-machine mock match working

**Alpha:**
- [ ] Colyseus authoritative server stable
- [ ] Rooms/Lobby system
- [ ] 2-8 players supported
- [ ] 60 Hz simulation confirmed
- [ ] 20-30 Hz snapshots confirmed
- [ ] Reconciliation proven with latency test
- [ ] Sketched artwork integrated

**Beta:**
- [ ] Menus implemented
- [ ] Customization options
- [ ] Accessibility features (colorblind mode)
- [ ] Hazards implemented
- [ ] Spectator mode
- [ ] Replay system
- [ ] Match Data Recorder operational

**RC (Electron Build):**
- [ ] Electron installer created
- [ ] Settings manager integrated
- [ ] Performance targets met (≥60 FPS)
- [ ] Compatibility passes (Windows/macOS)
- [ ] QA checklists complete

### 14.3 Development Log

Add entries as work progresses:

**2025-11-10:**
- Created initial project structure
- Established folder hierarchy
- Documented architecture decisions
- Set up Git repository

**[YYYY-MM-DD]:**
- [Your future log entries here]

---

## Appendix A: Quick Command Reference

```bash
# Development
npm run dev                    # Start both client and server
npm run dev:client            # Client only
npm run dev:server            # Server only

# Building
npm run build                 # Build both client and server
npm run build:client          # Client only
npm run build:server          # Server only

# Testing
npm run test                  # Run all tests
npm run test:ui               # Run tests with UI
npm run test -- --coverage    # With coverage report

# Linting & Formatting
npm run lint                  # Run ESLint
npm run format                # Run Prettier

# Validation
npm run validate:config       # Validate JSON configs

# Electron
npm run electron:dev          # Run Electron in dev mode
npm run electron:build        # Package Electron app

# Utilities
npx tsc --noEmit             # Type check without building
npx vite --host              # Expose dev server to network
```

---

## Appendix B: File Templates

### B.1 TypeScript Class Template

```typescript
/**
 * [Brief description of class purpose]
 * 
 * @remarks
 * [Additional context, usage notes, architectural decisions]
 */
export class ClassName {
  private privateProperty: Type;
  public publicProperty: Type;

  /**
   * Creates an instance of ClassName.
   * 
   * @param param1 - Description of param1
   * @param param2 - Description of param2
   */
  constructor(param1: Type, param2: Type) {
    this.privateProperty = param1;
    this.publicProperty = param2;
  }

  /**
   * [Method description]
   * 
   * @param param - Description
   * @returns Description of return value
   */
  public methodName(param: Type): ReturnType {
    // Implementation
  }

  /**
   * Update method called each frame/tick
   * 
   * @param deltaTime - Time since last update in seconds
   */
  public update(deltaTime: number): void {
    // Update logic
  }
}
```

### B.2 Phaser Scene Template

```typescript
import Phaser from 'phaser';

/**
 * [Scene name and purpose]
 * 
 * @remarks
 * [Scene flow, data passed in, transitions]
 */
export class SceneName extends Phaser.Scene {
  private dataProperty!: Type;

  constructor() {
    super({ key: 'SceneName' });
  }

  /**
   * Initialize scene with data from previous scene
   */
  init(data: any): void {
    this.dataProperty = data.property;
  }

  /**
   * Preload assets needed for this scene
   */
  preload(): void {
    this.load.image('key', 'path/to/image.png');
  }

  /**
   * Create scene objects and setup
   */
  create(): void {
    // Setup scene objects
  }

  /**
   * Update loop (runs every frame)
   */
  update(time: number, delta: number): void {
    // Per-frame logic
  }
}
```

### B.3 Colyseus Room Template

```typescript
import { Room, Client } from 'colyseus';
import { RoomState } from '../schemas/RoomState';

/**
 * [Room name and purpose]
 * 
 * @remarks
 * [Room lifecycle, player limits, game mode]
 */
export class RoomName extends Room<RoomState> {
  maxClients = 16;
  private tickRate = 60;
  private tickInterval!: NodeJS.Timeout;

  /**
   * Initialize room when created
   */
  onCreate(options: any): void {
    this.setState(new RoomState());
    
    // Start simulation loop
    this.tickInterval = setInterval(() => {
      this.tick(1 / this.tickRate);
    }, 1000 / this.tickRate);

    this.setupMessageHandlers();
  }

  /**
   * Handle player joining
   */
  onJoin(client: Client, options: any): void {
    console.log(`${client.sessionId} joined`);
    // Add player to state
  }

  /**
   * Handle player leaving
   */
  onLeave(client: Client, consented: boolean): void {
    console.log(`${client.sessionId} left`);
    // Remove player from state
  }

  /**
   * Room cleanup
   */
  onDispose(): void {
    clearInterval(this.tickInterval);
  }

  /**
   * Server tick (authoritative simulation)
   */
  private tick(deltaTime: number): void {
    // Update game state
  }

  /**
   * Setup message handlers
   */
  private setupMessageHandlers(): void {
    this.onMessage('input', (client, message) => {
      // Handle input
    });
  }
}
```

---

## Notes for Claude CLI

**When reading this document:**
1. Always check the **Current Status** section (14.1) to understand project phase
2. Reference the **GDD v23** for design decisions not covered here
3. Follow the **Folder Structure** (Section 3) strictly
4. Use **Config Files** (Section 5) for all gameplay values
5. Apply **Multiplayer Architecture** patterns (Section 7) for networking code
6. Adhere to **Code Organization Principles** (Section 8) for all files

**When creating code:**
- Use templates from Appendix B as starting points
- Reference **Common Patterns** (Section 11) for architecture
- Apply **Single Responsibility** principle (one concern per file)
- Never hardcode gameplay values (use config)
- Add TypeScript comments for non-obvious logic

**When stuck:**
- Check **Troubleshooting** (Section 12)
- Reference **Core Documentation** links (Section 13.1)
- Review **Multiplayer Networking** resources (Section 13.2)

**Key Reminders:**
- Server is **authoritative** - client predicts movement only
- No DOM code in server or shared directories
- All gameplay numbers in JSON config files
- Modular structure - one file, one responsibility
- TypeScript strict mode - no implicit any

---

**End of Document**
