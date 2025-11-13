# Testing Strategy Guide

**Folder:** `tests/`
**Purpose:** Test files for unit, integration, and E2E testing

---

## Overview

This folder contains all test files for the DISCUS game, organized by test type:
- Unit tests (pure functions, utilities)
- Integration tests (systems working together)
- End-to-end tests (full game scenarios)

## Testing Framework

**Framework:** Vitest (compatible with Vite)
**UI:** @vitest/ui (optional visual test runner)

---

## Folder Structure

```
tests/
├── unit/                  # Unit tests
│   ├── shared/
│   │   ├── Vector2.test.ts
│   │   ├── CollisionUtils.test.ts
│   │   └── Interpolation.test.ts
│   │
│   ├── server/
│   │   ├── PhysicsSystem.test.ts
│   │   ├── CollisionSystem.test.ts
│   │   └── ScoreSystem.test.ts
│   │
│   └── client/
│       ├── InputManager.test.ts
│       └── PredictionSystem.test.ts
│
├── integration/           # Integration tests
│   ├── server/
│   │   ├── GameRoom.test.ts
│   │   └── LobbyRoom.test.ts
│   │
│   └── client-server/
│       ├── Movement.test.ts
│       └── Combat.test.ts
│
└── e2e/                   # End-to-end tests
    ├── FullMatch.test.ts
    └── Multiplayer.test.ts
```

---

## Testing Philosophy

### Test Pyramid

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

### What to Test

- ✅ Pure functions (math, utilities)
- ✅ Game logic (collision, scoring)
- ✅ State management
- ✅ Network message handling
- ✅ Configuration loading
- ✅ Input validation

### What NOT to Test

- ❌ Framework internals (Phaser, Colyseus)
- ❌ Third-party libraries
- ❌ Trivial getters/setters
- ❌ Visual rendering (use manual testing)

---

## Running Tests

### All Tests

```bash
npm run test
```

### Specific Test File

```bash
npm run test src/shared/utils/Vector2.test.ts
```

### Watch Mode

```bash
npm run test -- --watch
```

### With UI

```bash
npm run test:ui
# Opens browser at http://localhost:51204/__vitest__/
```

### Coverage Report

```bash
npm run test -- --coverage
```

---

## Unit Testing

### Example: Vector2 Test

```typescript
// tests/unit/shared/Vector2.test.ts
import { describe, it, expect } from 'vitest';
import { Vector2 } from '../../../src/shared/utils/Vector2';

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

  describe('add', () => {
    it('adds two vectors correctly', () => {
      const v1 = new Vector2(1, 2);
      const v2 = new Vector2(3, 4);
      const result = v1.add(v2);
      expect(result.x).toBe(4);
      expect(result.y).toBe(6);
    });
  });

  describe('distanceTo', () => {
    it('calculates distance between two vectors', () => {
      const v1 = new Vector2(0, 0);
      const v2 = new Vector2(3, 4);
      expect(v1.distanceTo(v2)).toBe(5);
    });
  });
});
```

### Example: Collision System Test

```typescript
// tests/unit/server/CollisionSystem.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { CollisionSystem } from '../../../src/server/systems/CollisionSystem';
import { ServerPlayer } from '../../../src/server/entities/ServerPlayer';
import { ServerDiscus } from '../../../src/server/entities/ServerDiscus';

describe('CollisionSystem', () => {
  let system: CollisionSystem;
  let players: Map<string, ServerPlayer>;
  let discuses: Map<string, ServerDiscus>;

  beforeEach(() => {
    players = new Map();
    discuses = new Map();
    system = new CollisionSystem(players, discuses);
  });

  describe('update', () => {
    it('detects collision when discus overlaps player', () => {
      // Arrange
      const player = new ServerPlayer('player1', { x: 100, y: 100 });
      player.radius = 16;
      players.set('player1', player);

      const discus = new ServerDiscus('discus1', { x: 100, y: 100 });
      discus.radius = 8;
      discuses.set('discus1', discus);

      // Act
      const events = system.update(0.016);

      // Assert
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('discus-hit');
      expect(events[0].playerId).toBe('player1');
      expect(events[0].discusId).toBe('discus1');
    });

    it('does not detect collision when discus is far from player', () => {
      // Arrange
      const player = new ServerPlayer('player1', { x: 100, y: 100 });
      player.radius = 16;
      players.set('player1', player);

      const discus = new ServerDiscus('discus1', { x: 200, y: 200 });
      discus.radius = 8;
      discuses.set('discus1', discus);

      // Act
      const events = system.update(0.016);

      // Assert
      expect(events).toHaveLength(0);
    });
  });
});
```

---

## Integration Testing

### Example: Colyseus Room Test

```typescript
// tests/integration/server/GameRoom.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { GameRoom } from '../../../src/server/rooms/GameRoom';
import { ColyseusTestServer } from '@colyseus/testing';

describe('GameRoom', () => {
  let server: ColyseusTestServer;

  beforeEach(async () => {
    server = new ColyseusTestServer();
    server.define('game', GameRoom);
  });

  afterEach(async () => {
    await server.shutdown();
  });

  it('allows player to join', async () => {
    const room = await server.createRoom('game');
    const client = await server.connectTo(room);

    expect(room.state.players.size).toBe(1);
    expect(room.state.players.has(client.sessionId)).toBe(true);
  });

  it('processes player input', async () => {
    const room = await server.createRoom('game');
    const client = await server.connectTo(room);

    // Get initial position
    const initialX = room.state.players.get(client.sessionId).x;

    // Send movement input
    client.send('input', {
      sequenceNumber: 1,
      timestamp: Date.now(),
      moveX: 1,
      moveY: 0,
      throwing: false,
      blocking: false,
      dodging: false
    });

    // Wait for next tick
    await new Promise(resolve => setTimeout(resolve, 20));

    // Check player moved
    const player = room.state.players.get(client.sessionId);
    expect(player.x).toBeGreaterThan(initialX);
  });

  it('removes player on disconnect', async () => {
    const room = await server.createRoom('game');
    const client = await server.connectTo(room);

    expect(room.state.players.size).toBe(1);

    await client.leave();

    // Wait for disconnect processing
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(room.state.players.size).toBe(0);
  });

  it('broadcasts state to all clients', async () => {
    const room = await server.createRoom('game');
    const client1 = await server.connectTo(room);
    const client2 = await server.connectTo(room);

    // Client 1 moves
    client1.send('input', {
      sequenceNumber: 1,
      timestamp: Date.now(),
      moveX: 1,
      moveY: 0,
      throwing: false,
      blocking: false,
      dodging: false
    });

    // Wait for state update
    await new Promise(resolve => setTimeout(resolve, 50));

    // Both clients should see the same state
    const player1FromClient1 = room.state.players.get(client1.sessionId);
    const player1FromClient2 = room.state.players.get(client1.sessionId);

    expect(player1FromClient1.x).toBe(player1FromClient2.x);
  });
});
```

---

## End-to-End Testing

### Example: Full Match Test

```typescript
// tests/e2e/FullMatch.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { ColyseusTestServer } from '@colyseus/testing';
import { GameRoom } from '../../src/server/rooms/GameRoom';

describe('Full Match E2E', () => {
  let server: ColyseusTestServer;

  beforeEach(async () => {
    server = new ColyseusTestServer();
    server.define('game', GameRoom);
  });

  afterEach(async () => {
    await server.shutdown();
  });

  it('completes a full match with scoring', async () => {
    // Create room with 2 players
    const room = await server.createRoom('game', { maxPlayers: 2 });
    const player1 = await server.connectTo(room);
    const player2 = await server.connectTo(room);

    // Wait for match to start
    await new Promise(resolve => setTimeout(resolve, 100));

    // Player 1 throws discus
    player1.send('input', {
      sequenceNumber: 1,
      timestamp: Date.now(),
      moveX: 0,
      moveY: 0,
      throwing: true,
      blocking: false,
      dodging: false
    });

    // Wait for throw to process
    await new Promise(resolve => setTimeout(resolve, 50));

    // Verify discus was created
    expect(room.state.discuses.size).toBeGreaterThan(0);

    // Simulate match duration
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify scores updated
    const team1Score = room.state.teamScores.get('team1');
    const team2Score = room.state.teamScores.get('team2');

    expect(team1Score).toBeDefined();
    expect(team2Score).toBeDefined();
  }, 10000); // Increase timeout for E2E tests
});
```

---

## Performance Testing

### Latency Measurement

```typescript
// tests/integration/client-server/Latency.test.ts
import { describe, it, expect } from 'vitest';

describe('Network Latency', () => {
  it('measures round-trip time', async () => {
    const room = await client.joinOrCreate('game');

    const measurements: number[] = [];

    for (let i = 0; i < 10; i++) {
      const start = performance.now();

      await new Promise((resolve) => {
        room.send('ping', { timestamp: start });
        room.onMessage('pong', (message) => {
          const latency = performance.now() - message.timestamp;
          measurements.push(latency);
          resolve(null);
        });
      });

      // Wait between measurements
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Calculate average latency
    const avgLatency = measurements.reduce((a, b) => a + b, 0) / measurements.length;

    console.log(`Average latency: ${avgLatency.toFixed(2)}ms`);

    // Assert latency is reasonable (< 100ms for local testing)
    expect(avgLatency).toBeLessThan(100);
  });
});
```

### Tick Rate Accuracy

```typescript
// tests/integration/server/TickRate.test.ts
import { describe, it, expect } from 'vitest';

describe('Server Tick Rate', () => {
  it('maintains 60 Hz tick rate', async () => {
    const room = await server.createRoom('game');

    const tickTimestamps: number[] = [];

    // Subscribe to state changes
    room.state.onChange = () => {
      tickTimestamps.push(Date.now());
    };

    // Wait for 1 second
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Calculate average tick interval
    const intervals: number[] = [];
    for (let i = 1; i < tickTimestamps.length; i++) {
      intervals.push(tickTimestamps[i] - tickTimestamps[i - 1]);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const expectedInterval = 1000 / 60; // 16.67ms

    console.log(`Average tick interval: ${avgInterval.toFixed(2)}ms`);
    console.log(`Expected interval: ${expectedInterval.toFixed(2)}ms`);

    // Allow 10% tolerance
    expect(avgInterval).toBeCloseTo(expectedInterval, 2);
  }, 5000);
});
```

---

## Test Utilities

### Mock Factories

```typescript
// tests/utils/factories.ts

export function createMockPlayer(overrides?: Partial<ServerPlayer>): ServerPlayer {
  return {
    sessionId: 'test-player',
    position: { x: 100, y: 100 },
    velocity: { x: 0, y: 0 },
    state: 'idle',
    hasDiscus: false,
    teamId: 'team1',
    radius: 16,
    ...overrides
  };
}

export function createMockDiscus(overrides?: Partial<ServerDiscus>): ServerDiscus {
  return {
    id: 'test-discus',
    position: { x: 100, y: 100 },
    velocity: { x: 0, y: 0 },
    state: 'threat',
    ownerId: 'test-player',
    radius: 8,
    ...overrides
  };
}

export function createMockInput(overrides?: Partial<PlayerInput>): PlayerInput {
  return {
    sequenceNumber: 1,
    timestamp: Date.now(),
    moveX: 0,
    moveY: 0,
    throwing: false,
    blocking: false,
    dodging: false,
    ...overrides
  };
}
```

### Test Helpers

```typescript
// tests/utils/helpers.ts

export async function waitForTick(ms: number = 20): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function expectVector2ToBeClose(
  actual: { x: number; y: number },
  expected: { x: number; y: number },
  precision: number = 2
): void {
  expect(actual.x).toBeCloseTo(expected.x, precision);
  expect(actual.y).toBeCloseTo(expected.y, precision);
}

export function expectCollision(
  pos1: { x: number; y: number },
  radius1: number,
  pos2: { x: number; y: number },
  radius2: number
): void {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  expect(distance).toBeLessThan(radius1 + radius2);
}
```

---

## Code Coverage

### Running Coverage

```bash
npm run test -- --coverage
```

### Coverage Report

```
------------------|---------|----------|---------|---------|-------------------
File              | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
------------------|---------|----------|---------|---------|-------------------
All files         |   85.23 |    78.45 |   82.11 |   86.34 |
 src/shared       |   92.15 |    88.22 |   90.45 |   93.12 |
 src/server       |   81.34 |    75.67 |   78.90 |   82.45 |
 src/client       |   78.45 |    70.12 |   75.34 |   79.23 |
------------------|---------|----------|---------|---------|-------------------
```

### Coverage Goals

- **Shared code:** > 90% (easiest to test)
- **Server code:** > 80% (critical logic)
- **Client code:** > 70% (harder to test rendering)

---

## Best Practices

### 1. Test Behavior, Not Implementation

```typescript
// ❌ BAD: Tests implementation details
it('calls internalHelper method', () => {
  const spy = vi.spyOn(system, 'internalHelper');
  system.update(0.016);
  expect(spy).toHaveBeenCalled();
});

// ✅ GOOD: Tests behavior
it('detects collision when entities overlap', () => {
  const events = system.update(0.016);
  expect(events).toHaveLength(1);
  expect(events[0].type).toBe('collision');
});
```

### 2. Use Descriptive Test Names

```typescript
// ❌ BAD: Unclear test name
it('works', () => { ... });

// ✅ GOOD: Clear test name
it('returns zero vector when magnitude is zero', () => { ... });
```

### 3. Arrange-Act-Assert Pattern

```typescript
it('calculates distance correctly', () => {
  // Arrange
  const v1 = new Vector2(0, 0);
  const v2 = new Vector2(3, 4);

  // Act
  const distance = v1.distanceTo(v2);

  // Assert
  expect(distance).toBe(5);
});
```

### 4. Keep Tests Independent

```typescript
// ❌ BAD: Tests depend on each other
it('test1', () => {
  globalState.value = 10;
});

it('test2', () => {
  expect(globalState.value).toBe(10); // Depends on test1!
});

// ✅ GOOD: Tests are independent
beforeEach(() => {
  globalState.value = 10;
});

it('test1', () => {
  expect(globalState.value).toBe(10);
});

it('test2', () => {
  expect(globalState.value).toBe(10);
});
```

---

## Resources

**Vitest:**
- Documentation: https://vitest.dev/
- API Reference: https://vitest.dev/api/

**Colyseus Testing:**
- Testing Guide: https://docs.colyseus.io/testing/

**Testing Best Practices:**
- Testing Library: https://testing-library.com/docs/guiding-principles

---

## Key Reminders

- **Many unit tests** - Foundation of test pyramid
- **Test behavior, not implementation** - Focus on what, not how
- **Keep tests independent** - No shared state between tests
- **Use descriptive names** - Clear, specific test names
- **Aim for high coverage** - > 80% for critical code
- **Mock external dependencies** - Isolate code under test
