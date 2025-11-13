# Server-Side Development Guide

**Folder:** `src/server/`
**Purpose:** All code that runs in the Node.js server process

---

## Overview

This folder contains all server-side code for the DISCUS game, including:
- Colyseus rooms and authoritative game logic
- Physics simulation and collision detection
- Match state management and scoring
- AI behaviors for drones and CPU players
- Input validation and anti-cheat

## Technology Stack

**Framework:** Node.js with Colyseus
**Language:** TypeScript
**Architecture:** Authoritative server, room-based multiplayer
**State Management:** Colyseus Schema for serialization

---

## Folder Structure

```
src/server/
├── index.ts                # Server entry point
│
├── rooms/                  # Colyseus rooms
│   ├── GameRoom.ts        # Main game room
│   ├── LobbyRoom.ts       # Lobby/waiting room
│   └── ArcadeRoom.ts      # Local arcade mode room
│
├── entities/               # Server-side entities (authoritative)
│   ├── ServerPlayer.ts    # Server player state
│   ├── ServerDiscus.ts    # Server discus physics
│   ├── ServerDrone.ts     # Server drone AI
│   └── ServerHazard.ts    # Server hazard state
│
├── systems/                # Server-side systems
│   ├── PhysicsSystem.ts   # Authoritative physics
│   ├── CollisionSystem.ts # Hit detection
│   ├── ScoreSystem.ts     # Score tracking
│   ├── MatchTimer.ts      # Match timing logic
│   ├── InputValidator.ts  # Input validation
│   └── StateSnapshot.ts   # State serialization
│
├── ai/                     # AI behaviors
│   ├── DroneAI.ts         # Drone movement patterns
│   └── CPUPlayer.ts       # CPU-controlled players
│
└── utils/                  # Server utilities
    ├── TickScheduler.ts   # 60Hz tick management
    └── NetworkUtils.ts    # Network helpers
```

---

## Development Workflow

### Starting Server Development

```bash
npm run dev:server
# Nodemon watches for changes
# Auto-restarts on file save
# Server runs on ws://localhost:2567
```

### Building for Production

```bash
npm run build:server
# Output: dist/server/
# - Transpiled TypeScript → JavaScript
# - Node.js ready
```

---

## Authoritative Server Pattern

### Core Principles

1. **Server has final authority on all game state**
2. **Server validates and corrects all actions**
3. **No client-side hit detection or scoring**
4. **Clients predict ONLY player movement**

### Server Authority Flow

```
User Input → Client Prediction → Server Validation → State Update → Broadcast → Client Reconciliation
```

---

## Server Tick System

### Server Loop (60 Hz)

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

### Snapshot Broadcasting (20-30 Hz)

- Not every tick is sent to clients (too much bandwidth)
- Server sends snapshots 20-30 times per second
- Each snapshot includes timestamp and full state

---

## Input Processing

### Input Validation

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

### Input Validation Rules

```typescript
function isValidInput(input: PlayerInput): boolean {
  // Check for invalid movement values
  if (Math.abs(input.moveX) > 1 || Math.abs(input.moveY) > 1) {
    return false;
  }

  // Check timestamp is reasonable
  const now = Date.now();
  if (Math.abs(input.timestamp - now) > 5000) {
    return false; // More than 5 seconds off
  }

  // Check sequence number is increasing
  // (implement per-client tracking)

  return true;
}
```

---

## Colyseus Room Pattern

### Room Template

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

## Server Entity Pattern

### ServerPlayer Example

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

---

## System Pattern

### CollisionSystem Example

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

---

## Code Organization Principles

### Server Code Can Use

- ✅ Node.js APIs (fs, path, etc.)
- ✅ Colyseus
- ✅ Express for HTTP endpoints
- ✅ File system access

### Server Code Cannot

- ❌ Contain rendering logic
- ❌ Use DOM APIs
- ❌ Use browser-specific APIs
- ❌ Use Phaser

### Separation of Concerns

- **One mechanic per file** - Each file has ONE clear purpose
- **Authoritative logic only** - All game state is controlled by server
- **Validate all inputs** - Never trust client data

---

## Networking Constants

From `src/config/network.json`:

```json
{
  "server": {
    "tickRate": 60,
    "snapshotRate": 20
  }
}
```

**Explanation:**
- **tickRate (60 Hz):** Server simulates physics 60 times per second
- **snapshotRate (20 Hz):** Server sends state to clients 20 times per second

---

## Critical Networking Rules

1. **Server is always right** - Never trust client for hit detection or scoring
2. **Validate all inputs** - Server must validate every client message
3. **Handle packet loss** - System must work even with dropped packets
4. **Timestamp everything** - All messages must have timestamps for reconciliation
5. **Rate limit clients** - Prevent spam and cheating

---

## Code Style Guidelines

### TypeScript Strict Mode

```typescript
// Prefer explicit types
function applyInput(player: ServerPlayer, input: PlayerInput): void {
  // ...
}

// ❌ BAD: Implicit any
function applyInput(player, input) {
  // ...
}
```

### Use Config, Not Magic Numbers

```typescript
// ✅ GOOD: Use config
const playerSpeed = config.get('physics.player.speed');
player.velocity.x = input.moveX * playerSpeed;

// ❌ BAD: Magic numbers
player.velocity.x = input.moveX * 200;
```

### Comment Why, Not What

```typescript
// ✅ GOOD: Explain reasoning
// Reduce speed during dodge to prevent exploits where players
// dodge repeatedly to move faster than walking
player.speed = 200;

// ❌ BAD: Obvious comment
// Set player speed to 200
player.speed = 200;
```

---

## Debugging

### Server Logging

```typescript
// Add logging to server tick
console.log(`[Tick ${tickNumber}] Players: ${players.size}, Discuses: ${discuses.size}`);
```

### Network Latency Simulation

```typescript
// In network config
config.latency.simulatedDelay = 100; // Add 100ms artificial delay
```

---

## Common Issues

### Issue: Server not starting

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

### Issue: Client can't connect to server

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

### Issue: Position synchronization errors

**Solution:** Check for float precision issues

```typescript
// Round positions to avoid float drift
player.position.x = Math.round(player.position.x * 100) / 100;
player.position.y = Math.round(player.position.y * 100) / 100;
```

---

## Resources

**Colyseus:**
- Main Docs: https://docs.colyseus.io/
- State Management: https://docs.colyseus.io/state/overview/
- Phaser Tutorial: https://docs.colyseus.io/tutorial/phaser/

**Node.js:**
- Documentation: https://nodejs.org/docs/

**Multiplayer Networking:**
- Gabriel Gambetta's Series: https://www.gabrielgambetta.com/client-server-game-architecture.html
- Fast-Paced Multiplayer: https://www.gabrielgambetta.com/client-side-prediction-server-reconciliation.html

---

## Key Reminders

- **Server is authoritative** - Final say on all game state
- **Validate all inputs** - Never trust client data
- **One file, one responsibility** - Keep code modular and focused
- **TypeScript strict mode** - No implicit any
- **60Hz simulation** - Consistent tick rate for physics
