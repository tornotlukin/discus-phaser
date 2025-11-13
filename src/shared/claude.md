# Shared Code Development Guide

**Folder:** `src/shared/`
**Purpose:** Code shared between client and server

---

## Overview

This folder contains code that is used by both the client and server, including:
- Type definitions and interfaces
- Colyseus state schemas
- Shared constants and enums
- Pure utility functions (no DOM, no Node APIs)

## Key Principle

**SHARED CODE MUST BE PLATFORM-AGNOSTIC**

Code in this folder cannot use:
- ❌ Node.js APIs (fs, path, etc.)
- ❌ DOM APIs (document, window, etc.)
- ❌ Phaser-specific code
- ❌ Browser-specific APIs
- ❌ Server-specific APIs

---

## Folder Structure

```
src/shared/
├── types/                  # TypeScript definitions
│   ├── GameState.ts       # Game state types
│   ├── PlayerState.ts     # Player state types
│   ├── InputTypes.ts      # Input message types
│   └── NetworkTypes.ts    # Network protocol types
│
├── schemas/                # Colyseus state schemas
│   ├── RoomState.ts       # Room state schema
│   ├── PlayerSchema.ts    # Player schema
│   └── DiscusSchema.ts    # Discus schema
│
├── constants/              # Shared constants
│   ├── GameConstants.ts   # Gameplay constants
│   ├── PhysicsConstants.ts # Physics values
│   └── NetworkConstants.ts # Network settings
│
└── utils/                  # Shared utilities
    ├── Vector2.ts         # 2D vector math
    ├── CollisionUtils.ts  # Collision helpers
    └── Interpolation.ts   # Interpolation math
```

---

## Code Organization Principles

### Shared Code Can Use

- ✅ Pure TypeScript
- ✅ Math utilities
- ✅ Data structures (arrays, maps, sets)
- ✅ Pure functions (no side effects)
- ✅ Type definitions and interfaces

### Shared Code Cannot Use

- ❌ Node.js APIs (fs, path, etc.)
- ❌ DOM APIs (document, window, localStorage)
- ❌ Phaser APIs
- ❌ Browser-specific APIs (WebGL, Canvas, Audio)
- ❌ Server-specific APIs (Express, file system)

### Why This Matters

The shared code must work in **both** environments:
1. **Client** - Browser/Electron renderer process
2. **Server** - Node.js process

Using platform-specific APIs will cause runtime errors.

---

## Type Definitions

### Example: Input Message Types

```typescript
// src/shared/types/InputTypes.ts

/**
 * Player input message sent from client to server
 */
export interface PlayerInput {
  sequenceNumber: number;
  timestamp: number;
  moveX: number;        // -1, 0, or 1
  moveY: number;        // -1, 0, or 1
  throwing: boolean;
  blocking: boolean;
  dodging: boolean;
}

/**
 * Input acknowledgment sent from server to client
 */
export interface InputAck {
  sequenceNumber: number;
  timestamp: number;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
}
```

### Example: Player State Types

```typescript
// src/shared/types/PlayerState.ts

/**
 * Player state enum
 */
export enum PlayerState {
  Idle = 'idle',
  Moving = 'moving',
  Blocking = 'blocking',
  Dodging = 'dodging',
  Disintegrated = 'disintegrated'
}

/**
 * Player data interface
 */
export interface PlayerData {
  sessionId: string;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  state: PlayerState;
  hasDiscus: boolean;
  teamId: string;
}
```

---

## Colyseus Schemas

### Room State Schema

```typescript
// src/shared/schemas/RoomState.ts
import { Schema, MapSchema, type } from '@colyseus/schema';
import { PlayerSchema } from './PlayerSchema';
import { DiscusSchema } from './DiscusSchema';

export class RoomState extends Schema {
  @type({ map: PlayerSchema })
  players = new MapSchema<PlayerSchema>();

  @type({ map: DiscusSchema })
  discuses = new MapSchema<DiscusSchema>();

  @type('number')
  matchTime: number = 180;

  @type({ map: 'number' })
  teamScores = new MapSchema<number>();
}
```

### Player Schema

```typescript
// src/shared/schemas/PlayerSchema.ts
import { Schema, type } from '@colyseus/schema';

export class PlayerSchema extends Schema {
  @type('string')
  sessionId: string;

  @type('number')
  x: number = 0;

  @type('number')
  y: number = 0;

  @type('number')
  velocityX: number = 0;

  @type('number')
  velocityY: number = 0;

  @type('string')
  state: string = 'idle';

  @type('boolean')
  hasDiscus: boolean = false;

  @type('string')
  teamId: string;
}
```

---

## Shared Constants

### Game Constants

```typescript
// src/shared/constants/GameConstants.ts

/**
 * Game-wide constants
 * These values should match the config files
 */
export const GameConstants = {
  MAX_PLAYERS: 16,
  MIN_PLAYERS: 2,
  MATCH_DURATION: 180, // seconds
  TEAM_COUNT: 8,
} as const;

/**
 * Team colors (used by both client and server)
 */
export const TeamColors = {
  RED: '#FF0000',
  BLUE: '#0000FF',
  GREEN: '#00FF00',
  YELLOW: '#FFFF00',
  PURPLE: '#800080',
  ORANGE: '#FFA500',
  CYAN: '#00FFFF',
  MAGENTA: '#FF00FF',
} as const;
```

### Physics Constants

```typescript
// src/shared/constants/PhysicsConstants.ts

/**
 * Physics constants (loaded from config at runtime)
 * These are defaults only
 */
export const PhysicsConstants = {
  PLAYER_SPEED: 200,
  PLAYER_RADIUS: 16,
  DISCUS_SPEED: 400,
  DISCUS_RADIUS: 8,
  GRAVITY: 0,
} as const;
```

### Network Constants

```typescript
// src/shared/constants/NetworkConstants.ts

/**
 * Network protocol constants
 */
export const NetworkConstants = {
  TICK_RATE: 60,              // Server simulation rate (Hz)
  SNAPSHOT_RATE: 20,          // Client update rate (Hz)
  INTERPOLATION_DELAY: 100,   // Client interpolation buffer (ms)
  RECONCILIATION_THRESHOLD: 5, // Position error threshold (pixels)
} as const;

/**
 * Message types
 */
export const MessageType = {
  INPUT: 'input',
  INPUT_ACK: 'inputAck',
  SNAPSHOT: 'snapshot',
  PING: 'ping',
  PONG: 'pong',
} as const;
```

---

## Shared Utilities

### Vector2 Math

```typescript
// src/shared/utils/Vector2.ts

/**
 * 2D Vector math utility
 */
export class Vector2 {
  constructor(
    public x: number = 0,
    public y: number = 0
  ) {}

  /**
   * Calculate vector length (magnitude)
   */
  public length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * Normalize vector to unit length
   */
  public normalize(): Vector2 {
    const len = this.length();
    if (len === 0) return new Vector2(0, 0);
    return new Vector2(this.x / len, this.y / len);
  }

  /**
   * Calculate distance to another vector
   */
  public distanceTo(other: Vector2): number {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Add two vectors
   */
  public add(other: Vector2): Vector2 {
    return new Vector2(this.x + other.x, this.y + other.y);
  }

  /**
   * Subtract two vectors
   */
  public subtract(other: Vector2): Vector2 {
    return new Vector2(this.x - other.x, this.y - other.y);
  }

  /**
   * Multiply vector by scalar
   */
  public multiply(scalar: number): Vector2 {
    return new Vector2(this.x * scalar, this.y * scalar);
  }

  /**
   * Dot product
   */
  public dot(other: Vector2): number {
    return this.x * other.x + this.y * other.y;
  }
}
```

### Collision Utilities

```typescript
// src/shared/utils/CollisionUtils.ts

/**
 * Circle-circle collision detection
 */
export function checkCircleCollision(
  pos1: { x: number; y: number },
  radius1: number,
  pos2: { x: number; y: number },
  radius2: number
): boolean {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < (radius1 + radius2);
}

/**
 * Point in circle collision detection
 */
export function checkPointInCircle(
  point: { x: number; y: number },
  circle: { x: number; y: number },
  radius: number
): boolean {
  const dx = point.x - circle.x;
  const dy = point.y - circle.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < radius;
}

/**
 * Line-circle intersection
 */
export function checkLineCircleIntersection(
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number },
  circle: { x: number; y: number },
  radius: number
): boolean {
  // Implementation...
  return false;
}
```

### Interpolation Utilities

```typescript
// src/shared/utils/Interpolation.ts

/**
 * Linear interpolation
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Vector2 linear interpolation
 */
export function lerpVector2(
  start: { x: number; y: number },
  end: { x: number; y: number },
  t: number
): { x: number; y: number } {
  return {
    x: lerp(start.x, end.x, t),
    y: lerp(start.y, end.y, t)
  };
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Smooth interpolation (ease in/out)
 */
export function smoothstep(start: number, end: number, t: number): number {
  t = clamp((t - start) / (end - start), 0, 1);
  return t * t * (3 - 2 * t);
}
```

---

## Configuration Access

Even in shared code, you can access configuration:

```typescript
import { ConfigLoader } from './ConfigLoader';

const config = ConfigLoader.getInstance();

// Read values
const playerSpeed = config.get('physics.player.speed');
const maxPlayers = config.get('game.maxPlayers');
```

---

## Testing Shared Code

Shared code is the **easiest to test** because it's pure and has no dependencies.

```typescript
// src/shared/utils/Vector2.test.ts
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

---

## Code Style Guidelines

### TypeScript Strict Mode

```typescript
// Prefer explicit types
export function calculateDistance(
  a: { x: number; y: number },
  b: { x: number; y: number }
): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// ❌ BAD: Implicit any
export function calculateDistance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}
```

### Pure Functions

```typescript
// ✅ GOOD: Pure function
export function addVectors(
  a: { x: number; y: number },
  b: { x: number; y: number }
): { x: number; y: number } {
  return { x: a.x + b.x, y: a.y + b.y };
}

// ❌ BAD: Mutates input
export function addVectors(
  a: { x: number; y: number },
  b: { x: number; y: number }
): { x: number; y: number } {
  a.x += b.x; // Mutation!
  a.y += b.y;
  return a;
}
```

### No Side Effects

```typescript
// ✅ GOOD: No side effects
export function calculateDamage(
  baseDamage: number,
  multiplier: number
): number {
  return baseDamage * multiplier;
}

// ❌ BAD: Side effects (logging, global state)
let totalDamage = 0;
export function calculateDamage(
  baseDamage: number,
  multiplier: number
): number {
  const damage = baseDamage * multiplier;
  console.log(`Damage: ${damage}`); // Side effect!
  totalDamage += damage; // Global state mutation!
  return damage;
}
```

---

## TypeScript Class Template

```typescript
/**
 * [Brief description of class purpose]
 *
 * @remarks
 * [Additional context, usage notes]
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
}
```

---

## Common Patterns

### Config Loader Pattern

```typescript
// src/shared/utils/ConfigLoader.ts
import baseConfig from '../../config/base.json';
import devConfig from '../../config/dev.json';
import prodConfig from '../../config/prod.json';

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

    // Deep merge: base → env-specific
    this.config = this.deepMerge(baseConfig, envConfig);
  }

  public get(path: string): any {
    return this.getNestedValue(this.config, path);
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  }

  private deepMerge(target: any, source: any): any {
    // Implementation of deep merge logic
    return { ...target, ...source };
  }
}
```

---

## Resources

**TypeScript:**
- Handbook: https://www.typescriptlang.org/docs/handbook/intro.html
- Do's and Don'ts: https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html

**Colyseus Schema:**
- State Management: https://docs.colyseus.io/state/overview/
- Schema API: https://docs.colyseus.io/state/schema/

---

## Key Reminders

- **Platform-agnostic code only** - No Node.js or browser APIs
- **Pure functions** - No side effects
- **Explicit types** - TypeScript strict mode
- **Easy to test** - Most testable code in the project
- **Used by both client and server** - Changes affect both sides
