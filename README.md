# DISCUS Game

A fast-paced multiplayer disc combat game built with Phaser 4, Colyseus, and TypeScript.

## Project Status

**Phase:** Framework Setup
**Version:** 0.1.0
**Last Updated:** 2025-11-10

## Quick Start

### Prerequisites

- Node.js 20.x LTS or higher
- npm 10.x or higher
- Git 2.40+
- TypeScript 5.3+

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development servers:**
   ```bash
   # Start both client and server
   npm run dev

   # Or start individually
   npm run dev:client    # Vite dev server on http://localhost:5173
   npm run dev:server    # Colyseus server on ws://localhost:2567
   ```

### Project Structure

```
discus-phaser/
├── src/
│   ├── client/          # Client-side Phaser code
│   │   ├── scenes/      # Phaser scenes
│   │   ├── entities/    # Game entities (client representation)
│   │   ├── systems/     # Client systems (input, prediction, etc.)
│   │   ├── ui/          # UI components
│   │   ├── network/     # Client networking
│   │   ├── rendering/   # Rendering utilities
│   │   └── utils/       # Client utilities
│   ├── server/          # Server-side Colyseus code
│   │   ├── rooms/       # Colyseus rooms
│   │   ├── entities/    # Server entities (authoritative)
│   │   ├── systems/     # Server systems (physics, collision, etc.)
│   │   ├── ai/          # AI behaviors
│   │   └── utils/       # Server utilities
│   ├── shared/          # Shared code between client/server
│   │   ├── types/       # TypeScript type definitions
│   │   ├── schemas/     # Colyseus state schemas
│   │   ├── constants/   # Shared constants
│   │   └── utils/       # Shared utilities
│   └── config/          # JSON configuration files
│       └── schemas/     # JSON Schema definitions
├── assets/              # Game assets
│   ├── sprites/         # Sprite sheets and textures
│   ├── audio/           # Sound effects and music
│   ├── fonts/           # Custom fonts
│   └── shaders/         # Custom shaders
├── docs/                # Documentation
├── tests/               # Test files
│   ├── unit/           # Unit tests
│   ├── integration/    # Integration tests
│   └── e2e/            # End-to-end tests
└── scripts/            # Build and utility scripts
```

## Development

### Available Scripts

- `npm run dev` - Start both client and server
- `npm run dev:client` - Start Vite dev server only
- `npm run dev:server` - Start Colyseus server only
- `npm run build` - Build both client and server
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Architecture

**Client-Side:**
- Framework: Phaser 4 (WebGL renderer)
- Bundler: Vite (fast HMR)
- Language: TypeScript (strict mode)

**Server-Side:**
- Framework: Node.js with Colyseus
- Architecture: Authoritative server, room-based multiplayer
- State Management: Colyseus Schema

**Multiplayer:**
- Server tick rate: 60 Hz
- Snapshot rate: 20-30 Hz to clients
- Client-side prediction for player movement only
- Entity interpolation for remote players
- Server reconciliation for mispredictions

## Documentation

See the following documents for detailed information:

- [DISCUS_claude.md](./DISCUS_claude.md) - Complete development guide for Claude CLI
- [docs/GDD_v23.md](./docs/) - Game Design Document (when available)

## Key Principles

1. **Authoritative Server** - Server has final authority on all game state
2. **Separation of Concerns** - One mechanic per file
3. **JSON Configuration** - All gameplay values in config files, no hardcoding
4. **Modular Programming** - Single responsibility principle

## Technology Stack

- **Phaser 4** - Game engine
- **Colyseus** - Multiplayer framework
- **TypeScript** - Programming language
- **Vite** - Build tool
- **Electron** - Desktop packaging
- **Vitest** - Testing framework

## License

MIT
