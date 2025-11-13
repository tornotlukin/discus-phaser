import { Server } from 'colyseus';
import { WebSocketTransport } from '@colyseus/ws-transport';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { GameRoom } from './rooms/GameRoom';

/**
 * DISCUS Multiplayer Server
 *
 * Architecture:
 * - Authoritative server with client-side prediction
 * - 60 Hz physics simulation
 * - 20 Hz state broadcast
 * - Room-based multiplayer
 *
 * Based on Gabriel Gambetta's Fast-Paced Multiplayer architecture
 */

// Load configuration
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 2567;
const MAX_ROOMS = process.env.MAX_ROOMS ? parseInt(process.env.MAX_ROOMS) : 10;

// Create Express app
const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// JSON body parser
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    uptime: process.uptime()
  });
});

// Lobby browsing endpoint (hook for future implementation)
app.get('/api/rooms', async (_req, res) => {
  try {
    // TODO: Implement room listing when matchMaker API is available
    // For now, return empty list
    res.json({ rooms: [] });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Create room endpoint (hook for future implementation)
app.post('/api/rooms/create', async (_req, res) => {
  try {
    // TODO: Implement room creation when matchMaker API is available
    // Clients should use direct connection for now
    res.json({
      message: 'Use direct WebSocket connection to join/create rooms'
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Server monitoring endpoint (hook for future tools)
app.get('/api/monitor', (req, res) => {
  const memoryUsage = process.memoryUsage();

  res.json({
    uptime: process.uptime(),
    memory: {
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
      external: memoryUsage.external
    },
    cpu: process.cpuUsage(),
    timestamp: Date.now()
  });
});

/**
 * Validate custom room settings
 * Only allows safe player-facing options
 */
function validateCustomSettings(settings: any = {}) {
  const defaults = {
    matchDuration: 180,
    mercyRuleThreshold: 10,
    suddenDeathEnabled: true
  };

  return {
    matchDuration: clamp(settings.matchDuration || defaults.matchDuration, 60, 600),
    mercyRuleThreshold: clamp(settings.mercyRuleThreshold || defaults.mercyRuleThreshold, 5, 20),
    suddenDeathEnabled: settings.suddenDeathEnabled !== undefined
      ? settings.suddenDeathEnabled
      : defaults.suddenDeathEnabled
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Create HTTP server
const server = http.createServer(app);

// Create Colyseus game server
const gameServer = new Server({
  transport: new WebSocketTransport({
    server
  })
});

// Register rooms
gameServer.define('game', GameRoom)
  .filterBy(['matchState']); // Allow filtering by match state for matchmaking

// Start server
gameServer.listen(PORT);

console.log(`🎮 DISCUS Server started`);
console.log(`📡 WebSocket: ws://localhost:${PORT}`);
console.log(`🌐 HTTP API: http://localhost:${PORT}`);
console.log(`🏠 Max Rooms: ${MAX_ROOMS}`);
console.log(`\nEndpoints:`);
console.log(`  GET  /health          - Health check`);
console.log(`  GET  /api/rooms       - List all rooms`);
console.log(`  POST /api/rooms/create - Create new room`);
console.log(`  GET  /api/monitor     - Server monitoring`);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received, shutting down gracefully...');
  await gameServer.gracefullyShutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 SIGINT received, shutting down gracefully...');
  await gameServer.gracefullyShutdown();
  process.exit(0);
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});
