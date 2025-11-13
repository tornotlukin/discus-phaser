# Client-Side Development Guide

**Folder:** `src/client/`
**Purpose:** All code that runs in the browser/Electron renderer process

---

## Overview

This folder contains all client-side code for the DISCUS game, including:
- Phaser 4 scenes and game objects
- Client-side prediction and interpolation
- UI components and rendering
- Input handling (keyboard, mouse, gamepad)
- Audio management
- Network client code

## Technology Stack

**Framework:** Phaser 4 (WebGL renderer, Canvas fallback)
**Physics:** Arcade Physics (lightweight, arcade-style)
**Bundler:** Vite (fast HMR during development)
**Language:** TypeScript (strict mode)

---

## Folder Structure

```
src/client/
├── index.html              # Entry HTML
├── main.ts                 # Client entry point
│
├── scenes/                 # Phaser scenes
│   ├── BootScene.ts       # Memory check sequence
│   ├── LogosScene.ts      # Publisher logos
│   ├── StartScene.ts      # Main menu
│   ├── LobbyScene.ts      # Multiplayer lobby
│   ├── CharSelectScene.ts # Character selection
│   ├── TeamSelectScene.ts # Team zone selection
│   ├── GameScene.ts       # Main gameplay
│   ├── SpectatorScene.ts  # Spectator mode
│   └── ResultsScene.ts    # End-of-match results
│
├── entities/               # Game entities (client representation)
│   ├── Player.ts          # Player entity
│   ├── Discus.ts          # Discus projectile
│   ├── Drone.ts           # Hazard drone
│   └── Hazard.ts          # Environmental hazards
│
├── systems/                # Client-side systems
│   ├── InputManager.ts    # Keyboard/mouse/gamepad input
│   ├── PredictionSystem.ts # Client-side prediction
│   ├── InterpolationSystem.ts # Entity interpolation
│   ├── ReconciliationSystem.ts # Server reconciliation
│   ├── CameraController.ts # Camera follow/zoom
│   └── AudioManager.ts    # Sound effects and music
│
├── ui/                     # UI components
│   ├── HUD.ts             # In-game HUD
│   ├── Scoreboard.ts      # Match scoreboard
│   ├── Menu.ts            # Menu system
│   ├── SettingsPanel.ts   # Settings UI
│   └── DebugOverlay.ts    # Debug information
│
├── network/                # Client networking
│   ├── ColyseusClient.ts  # Colyseus client wrapper
│   ├── RoomManager.ts     # Room connection handling
│   └── MessageHandlers.ts # Server message processing
│
├── rendering/              # Rendering utilities
│   ├── TrailRenderer.ts   # Discus trail effects
│   ├── OutlineShader.ts   # Colorblind outlines
│   ├── ParticleSystem.ts  # Particle effects
│   └── SpriteLoader.ts    # Asset loading
│
└── utils/                  # Client utilities
    ├── ColorblindMode.ts  # Colorblind palette swaps
    ├── MathUtils.ts       # Math helpers
    └── PerformanceMonitor.ts # FPS/latency tracking
```

---

## Development Workflow

### Starting Client Development Server

```bash
npm run dev:client
# Vite serves on http://localhost:5173
# Hot module replacement (HMR) enabled
```

### Building for Production

```bash
npm run build:client
# Output: dist/client/
# - Minified JS bundles
# - Optimized assets
# - Source maps (optional)
```

---

## Client-Side Prediction

### What Client Predicts

- ✅ Own player movement (walk, run)
- ✅ Own player position

### What Client Does NOT Predict

- ❌ Discus throwing/catching
- ❌ Hit detection
- ❌ Block/dodge results
- ❌ Score changes
- ❌ Other players' actions

### Movement Prediction Flow

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

### Client Reconciliation

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

---

## Entity Interpolation

### For Remote Players

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

---

## Code Organization Principles

### Client Code Can Use

- ✅ Phaser APIs
- ✅ DOM (document, window)
- ✅ localStorage
- ✅ Browser APIs (WebGL, Canvas, Audio)

### Client Code Cannot

- ❌ Contain authoritative game logic
- ❌ Perform hit detection or scoring
- ❌ Use Node.js APIs (fs, path, etc.)

### Separation of Concerns

- **One mechanic per file** - Each file has ONE clear purpose
- **No DOM/Electron code in game mechanics** - Keep game logic separate from UI
- **Modular programming** - Easy to test, easy to replace

---

## Input Handling Pattern

### InputManager Example

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

## Client Entity Pattern

### Player Entity Example

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

---

## Phaser Scene Template

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

---

## Network Message Format

### Client → Server (Input)

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

### Server → Client (Acknowledgment)

```typescript
interface InputAck {
  sequenceNumber: number;
  timestamp: number;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
}
```

### Server → Client (State Snapshot)

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

---

## Networking Constants

From `src/config/network.json`:

```json
{
  "client": {
    "interpolationDelay": 100,
    "reconciliationThreshold": 5
  }
}
```

**Explanation:**
- **interpolationDelay (100ms):** Client renders 100ms behind to have snapshots to interpolate
- **reconciliationThreshold (5px):** If prediction error > 5 pixels, correct client position

---

## Code Style Guidelines

### TypeScript Strict Mode

```typescript
// Prefer explicit types
function processInput(input: PlayerInput): void {
  // ...
}

// ❌ BAD: Implicit any
function processInput(input) {
  // ...
}
```

### Use Config, Not Magic Numbers

```typescript
// ✅ GOOD: Use config
const MAX_WALK_SPEED = config.get('physics.player.speed');
if (player.speed > MAX_WALK_SPEED) {
  player.isSprinting = true;
}

// ❌ BAD: Magic numbers
if (player.speed > 200) {
  player.isSprinting = true;
}
```

---

## Debugging

### Enable Debug Overlay

```typescript
// In client config
config.client.debugOverlay = true;
```

### Performance Monitoring

```typescript
// Use browser DevTools Performance tab
// Or add custom timing:
const start = performance.now();
// ... code to profile
const elapsed = performance.now() - start;
console.log(`Operation took ${elapsed}ms`);
```

---

## Resources

**Phaser 4:**
- Official Docs: https://phaser.io/phaser4
- API Reference: https://newdocs.phaser.io/docs/4.0.0
- Examples: https://labs.phaser.io/

**Colyseus Client:**
- Documentation: https://docs.colyseus.io/
- Client API: https://docs.colyseus.io/client/

**Multiplayer Networking:**
- Gabriel Gambetta's Series: https://www.gabrielgambetta.com/client-side-prediction-server-reconciliation.html
- Interactive Demo: https://www.gabrielgambetta.com/client-side-prediction-live-demo.html

---

## Key Reminders

- **Client predicts movement only** - Don't predict complex interactions
- **Interpolate remote entities** - Never trust immediate positions for remote players
- **No authoritative logic** - Server has final say on all game state
- **One file, one responsibility** - Keep code modular and focused
- **TypeScript strict mode** - No implicit any
